# Ore Route production activation

## Hosting

- Set GitHub Pages source to **GitHub Actions**.
- Run `Deploy Ore Route to GitHub Pages` on `main`.
- Confirm `https://lunadgtl-os.github.io/Oreroute-mining/` loads the authentication screen.

## Supabase Auth

Set the Site URL and redirect allow-list to:

`https://lunadgtl-os.github.io/Oreroute-mining/`

## Acceptance test

1. Register two users with separate test email addresses.
2. Create one organisation per user.
3. Create a passport and upload evidence as Organisation A.
4. Confirm Organisation B cannot access A's passport, document metadata or storage object.
5. Confirm operations users cannot perform finance-only trade changes.
6. Remove the test records after capturing the result.
