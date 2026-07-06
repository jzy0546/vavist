# Vavist Three.js Lab Entrance

A zero-dependency static homepage for `vavist.com`, rebuilt as the main entrance to Three.js Lab.

## Scope

- Home page with a live Three.js hero scene
- Launch links to the Three.js Lab tools and guides
- Local `/guides/` index with original Three.js/WebGL articles
- 24 guide pages covering GLTFLoader, camera fitting, shaders, lighting, particles, responsive canvas sizing, pivots, performance, color management, debugging, compression, labels, screenshots, gotchas, and static-site structure
- `/tools/` workflow index for the external lab tools
- `/webgl-scene-health-check/` browser-only publishing checklist
- `/resources/` primary-source reference library
- Custom `404.html`
- About, Contact, Privacy Policy, Terms of Use, Cookie Policy
- `robots.txt`, `sitemap.xml`
- Optional `CNAME` for a custom domain
- Optional `ads.txt` for advertising setup

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
$env:LAB_URL="https://threejs.vavist.com"
$env:CUSTOM_DOMAIN="vavist.com"
$env:GA_MEASUREMENT_ID="G-48SYW15X9Z"
$env:ADSENSE_CLIENT="ca-pub-0000000000000000"
$env:ADS_TXT_ACCOUNT="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
$env:CONTACT_EMAIL="hello@vavist.com"
npm run build
```

Only set `CUSTOM_DOMAIN`, `ADSENSE_CLIENT`, and `ADS_TXT_ACCOUNT` when the real values exist. Invalid advertising placeholders should not be published.
