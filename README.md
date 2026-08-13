# Vavist Three.js Lab Entrance

A zero-dependency static homepage for `vavist.com`, rebuilt as the main entrance to Three.js Lab.

## Scope

- Home page with a live Three.js hero scene
- Five Three.js tools published on the main domain under `/tools/`
- Local `/guides/` index with 10 maintained, tested Three.js/WebGL articles
- 14 legacy guide URLs retained as `noindex,follow` consolidation notices
- `/tools/` workflow index plus GLB, camera, shader, lighting, and examples pages
- `/webgl-scene-health-check/` browser-only publishing checklist
- `/resources/` primary-source reference library
- JZY author profile, editorial policy, and corrections policy
- Custom `404.html`
- About, Contact, Privacy Policy, Terms of Use, Cookie Policy
- `robots.txt`, `sitemap.xml`
- Optional `CNAME` for a custom domain
- Optional `ads.txt` for advertising setup

## Local Commands

```powershell
npm run build
npm run check
npm run smoke:tools
npm run serve
```

Open `http://localhost:4173` after starting the server.

## Production Configuration

Set these environment variables before building for deployment:

```powershell
$env:SITE_URL="https://vavist.com"
$env:CUSTOM_DOMAIN="vavist.com"
$env:GA_MEASUREMENT_ID="G-48SYW15X9Z"
$env:ADSENSE_CLIENT="ca-pub-3178114530361936"
$env:ADSENSE_MODE="off"
$env:ADS_TXT_ACCOUNT="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
$env:CONTACT_EMAIL="hello@vavist.com"
npm run build
```

`ADSENSE_MODE` accepts `off` or `content`. Keep it `off` during review.
`content` loads AdSense only on the 10 maintained guide pages; every other route
remains ineligible. `ADSENSE_CLIENT` can still provide the site-verification meta
tag while ad loading is off. Only set `CUSTOM_DOMAIN`, `ADSENSE_CLIENT`, and
`ADS_TXT_ACCOUNT` when the real values exist.

The nested `tools-app` has its own lockfile. A clean CI or local setup must run:

```powershell
npm ci
npm --prefix tools-app ci
```

The Vite tool build writes into `dist/tools/` without replacing the main
generator's `/tools/index.html`.
