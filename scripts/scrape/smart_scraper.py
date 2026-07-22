#!/usr/bin/env python3
"""Reusable, policy-respecting web scraper for Ore Route Mining, built on ScrapeGraphAI.

Run from the repo root with the ScrapeGraphAI venv active:

    source ~/tools/scrapegraph-ai-venv/bin/activate
    python scripts/scrape/smart_scraper.py \
        --url "https://example.com/commodity-prices" \
        --prompt "Extract each listed commodity as {name, price, unit, date}"

Scope and boundaries (read before use):
  - Public data only. This script has no feature to accept or send cookies,
    session tokens, or login credentials, and none should be added to it.
  - robots.txt is checked before every fetch. If it disallows the URL, or if
    robots.txt cannot be fetched/parsed at all, the script refuses to scrape
    that URL (fail closed) rather than assuming permission.
  - You are responsible for confirming the target site's Terms of Service
    permit automated access before pointing this at it.
  - API keys are read only from environment variables (OPENAI_API_KEY /
    ANTHROPIC_API_KEY / etc.). Never pass keys on the command line or commit
    them anywhere in this repository.
  - Output is written under scrape-output/ (gitignored) — nothing here
    modifies src/ or any production application code.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import logging
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("smart_scraper")

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_DIR = REPO_ROOT / "scrape-output"
DEFAULT_USER_AGENT = os.environ.get(
    "SCRAPER_USER_AGENT",
    "OreRouteMiningResearchBot/1.0 (public-data research; contact: set SCRAPER_CONTACT env var)",
)

# Maps the provider prefix in a "provider/model" string to the environment
# variable that must hold its API key. `None` means no key is required.
PROVIDER_ENV_KEYS = {
    "openai": "OPENAI_API_KEY",
    "azure_openai": "AZURE_OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "google_genai": "GOOGLE_API_KEY",
    "google_vertexai": "GOOGLE_API_KEY",
    "mistralai": "MISTRAL_API_KEY",
    "ollama": None,
}

DEFAULT_MODEL = os.environ.get("SCRAPER_LLM_MODEL", "openai/gpt-4o-mini")


class ScraperConfigError(RuntimeError):
    """Raised for bad CLI input or missing configuration."""


class RobotsDisallowedError(RuntimeError):
    """Raised when robots.txt disallows the request, or can't be verified."""


class ScrapeFailedError(RuntimeError):
    """Raised when the scrape did not succeed after all retries."""


class ValidationError(RuntimeError):
    """Raised when the scraped result fails structural validation."""


@dataclass
class RateLimiter:
    """Enforces a minimum delay between successive calls in this process."""

    min_delay_seconds: float
    _last_call: float | None = field(default=None, init=False)

    def wait(self) -> None:
        if self.min_delay_seconds <= 0 or self._last_call is None:
            self._last_call = time.monotonic()
            return
        elapsed = time.monotonic() - self._last_call
        remaining = self.min_delay_seconds - elapsed
        if remaining > 0:
            log.info("Rate limit: sleeping %.1fs before next request", remaining)
            time.sleep(remaining)
        self._last_call = time.monotonic()


def check_robots_allowed(url: str, user_agent: str) -> str:
    """Return the robots.txt URL if fetching `url` is allowed; raise otherwise.

    Fails closed: if robots.txt cannot be fetched or parsed for any reason,
    this refuses the request instead of assuming permission.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ScraperConfigError(f"Unsupported URL scheme: {parsed.scheme!r} in {url!r}")
    if not parsed.netloc:
        raise ScraperConfigError(f"Could not parse a host from URL: {url!r}")

    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    parser = RobotFileParser()
    parser.set_url(robots_url)
    try:
        parser.read()
    except Exception as exc:  # noqa: BLE001 - deliberately broad, fails closed below
        raise RobotsDisallowedError(
            f"Could not fetch or parse {robots_url} ({exc!r}); refusing to scrape "
            "without being able to confirm robots.txt permissions."
        ) from exc

    if not parser.can_fetch(user_agent, url):
        raise RobotsDisallowedError(
            f"robots.txt at {robots_url} disallows user-agent "
            f"{user_agent!r} from fetching {url!r}."
        )
    return robots_url


def resolve_api_key(model: str) -> str | None:
    """Look up the API key for `model` ("provider/name") from the environment.

    Never accepts a key as a CLI argument — only environment variables.
    """
    provider = model.split("/", 1)[0] if "/" in model else model
    env_var = PROVIDER_ENV_KEYS.get(provider)
    if env_var is None:
        if provider not in PROVIDER_ENV_KEYS:
            log.warning(
                "Unrecognised provider %r in model %r — assuming no API key env "
                "var is required. Set SCRAPER_LLM_MODEL to a known provider "
                "(%s) if that's wrong.",
                provider,
                model,
                ", ".join(sorted(k for k in PROVIDER_ENV_KEYS if k)),
            )
        return None
    api_key = os.environ.get(env_var)
    if not api_key:
        raise ScraperConfigError(
            f"Model {model!r} needs {env_var} set in the environment. "
            "This script never accepts API keys as arguments or reads them "
            "from committed files — export it in your shell before running."
        )
    return api_key


def build_graph_config(model: str, timeout_seconds: int, headless: bool) -> dict:
    api_key = resolve_api_key(model)
    llm_config: dict = {"model": model}
    if api_key:
        llm_config["api_key"] = api_key
    config = {
        "llm": llm_config,
        "verbose": False,
        "headless": headless,
        "loader_kwargs": {"requests_kwargs": {"timeout": timeout_seconds}},
    }
    return config


def run_with_hard_timeout(fn, timeout_seconds: int):
    """Run `fn()` in a worker thread and enforce a wall-clock timeout.

    ScrapeGraphAI's own per-request timeout only covers the HTTP fetch, not
    the LLM extraction step, so this is a backend-agnostic backstop.
    """
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
        future = pool.submit(fn)
        try:
            return future.result(timeout=timeout_seconds)
        except concurrent.futures.TimeoutError as exc:
            raise ScrapeFailedError(
                f"Scrape did not complete within {timeout_seconds}s (hard timeout)."
            ) from exc


def scrape_once(url: str, prompt: str, model: str, timeout_seconds: int, headless: bool) -> dict:
    # Imported lazily so `--dry-run` (robots-only checks) works even if the
    # scrapegraphai venv isn't active yet.
    from scrapegraphai.graphs import SmartScraperGraph

    config = build_graph_config(model, timeout_seconds, headless)
    graph = SmartScraperGraph(prompt=prompt, source=url, config=config)

    def _run():
        return graph.run()

    return run_with_hard_timeout(_run, timeout_seconds)


def retry_with_backoff(fn, retries: int, base_delay: float):
    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - retried broadly, re-raised at the end
            last_exc = exc
            if attempt == retries:
                break
            delay = base_delay * (2 ** (attempt - 1))
            log.warning(
                "Attempt %d/%d failed (%s); retrying in %.1fs",
                attempt,
                retries,
                exc,
                delay,
            )
            time.sleep(delay)
    raise ScrapeFailedError(f"Scrape failed after {retries} attempt(s): {last_exc}") from last_exc


def validate_result(result, schema_path: str | None) -> None:
    if result is None:
        raise ValidationError("Scrape returned no result (None).")
    if isinstance(result, (dict, list)) and len(result) == 0:
        raise ValidationError("Scrape returned an empty result.")
    if isinstance(result, str) and not result.strip():
        raise ValidationError("Scrape returned an empty string.")

    if schema_path:
        import jsonschema

        schema = json.loads(Path(schema_path).read_text(encoding="utf-8"))
        try:
            jsonschema.validate(instance=result, schema=schema)
        except jsonschema.ValidationError as exc:
            raise ValidationError(f"Result failed schema validation: {exc.message}") from exc


def save_output(
    output_dir: Path,
    url: str,
    prompt: str,
    model: str,
    result,
    valid: bool,
    error: str | None = None,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    domain = urlparse(url).netloc.replace(":", "_") or "unknown-host"
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    filename = f"{domain}__{timestamp}.json"
    path = output_dir / filename

    record = {
        "url": url,
        "prompt": prompt,
        "model": model,
        "scraped_at_utc": timestamp,
        "valid": valid,
        "error": error,
        "data": result,
    }
    path.write_text(json.dumps(record, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    return path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Reusable ScrapeGraphAI-backed scraper for public web data.",
    )
    parser.add_argument("--url", help="Single URL to scrape.")
    parser.add_argument(
        "--url-file",
        help="Path to a text file with one URL per line, scraped in order with rate limiting.",
    )
    parser.add_argument(
        "--prompt",
        required=True,
        help="Natural-language instruction describing what structured data to extract.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"LLM model as 'provider/name' (default: {DEFAULT_MODEL} or $SCRAPER_LLM_MODEL).",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Directory for structured JSON output (default: scrape-output/).",
    )
    parser.add_argument("--schema", help="Optional path to a JSON Schema file to validate results against.")
    parser.add_argument("--timeout", type=int, default=45, help="Per-URL timeout in seconds (default: 45).")
    parser.add_argument("--retries", type=int, default=3, help="Retry attempts per URL (default: 3).")
    parser.add_argument(
        "--delay",
        type=float,
        default=3.0,
        help="Minimum seconds between requests when scraping multiple URLs (default: 3.0).",
    )
    parser.add_argument(
        "--user-agent",
        default=DEFAULT_USER_AGENT,
        help="User-Agent string sent for the robots.txt check (identify yourself honestly).",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=True,
        help="Use a headless browser backend (default: on).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only run the robots.txt permission check; do not call the LLM or fetch content.",
    )
    args = parser.parse_args(argv)

    if not args.url and not args.url_file:
        raise ScraperConfigError("Provide --url or --url-file.")
    if args.url and args.url_file:
        raise ScraperConfigError("Provide --url or --url-file, not both.")
    return args


def load_urls(args: argparse.Namespace) -> list[str]:
    if args.url:
        return [args.url]
    lines = Path(args.url_file).read_text(encoding="utf-8").splitlines()
    urls = [line.strip() for line in lines if line.strip() and not line.strip().startswith("#")]
    if not urls:
        raise ScraperConfigError(f"No URLs found in {args.url_file!r}.")
    return urls


def process_url(url: str, args: argparse.Namespace) -> int:
    log.info("Checking robots.txt for %s", url)
    try:
        robots_url = check_robots_allowed(url, args.user_agent)
        log.info("Allowed by %s", robots_url)
    except RobotsDisallowedError as exc:
        log.error("Refusing %s: %s", url, exc)
        save_output(Path(args.output_dir), url, args.prompt, args.model, None, valid=False, error=str(exc))
        return 2
    except ScraperConfigError as exc:
        log.error("Config error for %s: %s", url, exc)
        return 1

    if args.dry_run:
        log.info("Dry run: robots.txt allows %s; skipping fetch/LLM call.", url)
        return 0

    try:
        result = retry_with_backoff(
            lambda: scrape_once(url, args.prompt, args.model, args.timeout, args.headless),
            retries=args.retries,
            base_delay=2.0,
        )
    except (ScrapeFailedError, ScraperConfigError) as exc:
        log.error("Scrape failed for %s: %s", url, exc)
        save_output(Path(args.output_dir), url, args.prompt, args.model, None, valid=False, error=str(exc))
        return 3

    try:
        validate_result(result, args.schema)
    except ValidationError as exc:
        log.error("Validation failed for %s: %s", url, exc)
        save_output(Path(args.output_dir), url, args.prompt, args.model, result, valid=False, error=str(exc))
        return 4

    path = save_output(Path(args.output_dir), url, args.prompt, args.model, result, valid=True)
    log.info("Saved validated result to %s", path)
    return 0


def main(argv: list[str] | None = None) -> int:
    try:
        args = parse_args(argv)
        urls = load_urls(args)
    except ScraperConfigError as exc:
        log.error("%s", exc)
        return 1

    limiter = RateLimiter(min_delay_seconds=args.delay)
    worst_code = 0
    for url in urls:
        limiter.wait()
        code = process_url(url, args)
        worst_code = max(worst_code, code)
    return worst_code


if __name__ == "__main__":
    sys.exit(main())
