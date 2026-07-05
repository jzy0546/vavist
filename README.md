# AI Prompt Tools MVP

A zero-dependency static MVP for testing organic search demand around free AI prompt tools.

## MVP Scope

- Home page
- 5 tool pages
  - AI Prompt Generator
  - AI Image Prompt Generator
  - ChatGPT Prompt Generator
  - AI Token Counter
  - AI Text Cleaner
- About, Contact, Privacy Policy, Terms of Use, Cookie Policy
- `robots.txt`, `sitemap.xml`
- Optional `CNAME` for a custom domain
- Optional `ads.txt` for AdSense after approval setup

## Local Commands

```powershell
npm run build
npm run check
npm run serve
```

Open `http://localhost:4173` after starting the server.

## Production Configuration

Set these environment variables before building for deployment:

```powershell
$env:SITE_URL="https://vavist.com"
$env:CUSTOM_DOMAIN="vavist.com"
$env:GA_MEASUREMENT_ID="G-XXXXXXXXXX"
$env:ADSENSE_CLIENT="ca-pub-0000000000000000"
$env:ADS_TXT_ACCOUNT="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
$env:CONTACT_EMAIL="hello@vavist.com"
npm run build
```

Only set `CUSTOM_DOMAIN`, `ADSENSE_CLIENT`, and `ADS_TXT_ACCOUNT` when the real values exist. Invalid AdSense placeholders should not be published.

## GitHub Pages

The included workflow builds `dist/` and publishes it with GitHub Pages. After pushing to GitHub:

1. Go to repository Settings.
2. Open Pages.
3. Set Source to GitHub Actions.
4. Run the `Deploy static site to Pages` workflow.

Custom domain and AdSense setup are documented in `docs/domain-and-adsense.md`.
