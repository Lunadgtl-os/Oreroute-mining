# Web scraper (ScrapeGraphAI)

A reusable, policy-respecting scraping script for pulling public structured
data (e.g. commodity prices, published shipping/regulatory notices) into this
repository's evaluation workflow. It does not touch `src/` or any production
application logic — it only writes JSON files under `scrape-output/`.

## Setup

The scraper depends on the `scrapegraphai` package, installed globally in a
dedicated venv (not part of this repo's Node toolchain):

```bash
source ~/tools/scrapegraph-ai-venv/bin/activate
```

Set an LLM API key as an environment variable — never in a file that gets
committed:

```bash
export OPENAI_API_KEY=sk-...        # if using the default openai/* model
# or
export ANTHROPIC_API_KEY=sk-ant-... # if using an anthropic/* model
```

## Usage

Single URL:

```bash
python scripts/scrape/smart_scraper.py \
  --url "https://example.com/commodity-prices" \
  --prompt "Extract each listed commodity as {name, price, unit, date}"
```

Multiple URLs (one per line in a file, `#`-prefixed lines ignored), scraped
sequentially with rate limiting between requests:

```bash
python scripts/scrape/smart_scraper.py \
  --url-file scripts/scrape/urls.txt \
  --prompt "Extract the same fields as above"
```

Check permissions only, without calling the LLM or fetching page content:

```bash
python scripts/scrape/smart_scraper.py --url "https://example.com" --prompt "n/a" --dry-run
```

Validate output against a JSON Schema:

```bash
python scripts/scrape/smart_scraper.py --url "..." --prompt "..." --schema scripts/scrape/schemas/commodity.schema.json
```

## What this script does and does not do

- **robots.txt is checked before every fetch.** If it disallows the URL, or
  if robots.txt can't be fetched/parsed at all, the script refuses that URL
  (fails closed) rather than assuming permission. There is no override flag —
  if a target needs to be scraped despite robots.txt, that's a decision to
  make outside this tool, on a case-by-case basis.
- **No authentication support.** The script has no option to pass cookies,
  session tokens, or login credentials, by design. It only works against
  publicly accessible pages. It is your responsibility to confirm the
  target site's Terms of Service permit automated access.
- **API keys come only from environment variables**, resolved from the
  `provider` prefix of `--model` (default `openai/gpt-4o-mini`, override with
  `--model` or `$SCRAPER_LLM_MODEL`). Keys are never accepted as CLI
  arguments, logged, or written to output files.
- **Rate limiting**: `--delay` (default 3s) enforces a minimum gap between
  requests when scraping a list of URLs.
- **Retries**: `--retries` (default 3) with exponential backoff on failure.
- **Timeout**: `--timeout` (default 45s) is a hard wall-clock limit per URL,
  covering both the HTTP fetch and the LLM extraction step.
- **Validation**: every result is checked for non-emptiness; pass `--schema`
  to additionally validate against a JSON Schema file. Failed or invalid
  results are still written to `scrape-output/` with `"valid": false` and an
  `"error"` field, for debugging — they are not silently dropped.
- **Output**: one JSON file per URL under `scrape-output/`
  (`<host>__<UTC-timestamp>.json`), gitignored — this is runtime data, not
  source. Nothing here is wired into the app until you've reviewed it.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success (or a clean `--dry-run`) |
| 1 | Configuration error (bad arguments, missing API key) |
| 2 | robots.txt disallowed the URL, or couldn't be verified |
| 3 | Scrape failed after all retries |
| 4 | Result failed validation |

When scraping multiple URLs, the process exit code is the worst (highest)
code across all URLs; per-URL results are still saved individually.
