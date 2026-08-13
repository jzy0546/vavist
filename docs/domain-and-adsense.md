# Domain And AdSense Handoff

This file lists the manual steps needed to move the MVP from a local static site to a custom-domain GitHub Pages site prepared for AdSense.

## Values Needed From You

- Final domain, currently `vavist.com`
- GitHub username and repository name
- Google Analytics Measurement ID, for example `G-48SYW15X9Z`
- Google Search Console verification method
- Google AdSense publisher ID, for example `pub-0000000000000000`
- AdSense `ads.txt` line, for example `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0`
- Contact email for public policy pages

## GitHub Pages Custom Domain

Manual stop point: you must own the domain and have access to its DNS settings.

1. Buy or choose the `.com` domain.
2. In the DNS provider, add GitHub Pages records.
   - For an apex domain, add GitHub Pages A records from GitHub's current Pages documentation.
   - For `www`, add a CNAME record pointing to your GitHub Pages host.
3. In GitHub, open the repository.
4. Go to Settings, then Pages.
5. Set Source to GitHub Actions.
6. Add the custom domain.
7. Wait for DNS verification.
8. Enable Enforce HTTPS after GitHub allows it.
9. Rebuild with:

```powershell
$env:SITE_URL="https://vavist.com"
$env:CUSTOM_DOMAIN="vavist.com"
npm run build
```

The build will generate `dist/CNAME` when `CUSTOM_DOMAIN` is set.

## Google Analytics And Search Console

Manual stop point: you must use your Google account.

1. Create a Google Analytics property.
2. Copy the Measurement ID.
3. Build with:

```powershell
$env:GA_MEASUREMENT_ID="G-48SYW15X9Z"
npm run build
```

4. Add the custom domain to Google Search Console.
5. Verify ownership using DNS verification or the recommended method from Google.
6. Submit `https://vavist.com/sitemap.xml`.

## AdSense Preparation

Manual stop point: AdSense approval is controlled by Google and cannot be automated from this project.

Recommended order:

1. Publish the MVP.
2. Let Google index the pages.
3. Watch Search Console for impressions and indexed URLs.
4. Confirm the 10 maintained guides and five tools have been recrawled.
5. Confirm the 14 consolidated guide URLs are excluded from the sitemap and show `noindex,follow`.
6. Add the site in Google AdSense.
7. Copy your publisher ID and ads.txt line.
8. Keep ad loading off while the site is under review:

```powershell
$env:ADSENSE_CLIENT="ca-pub-3178114530361936"
$env:ADSENSE_MODE="off"
$env:ADS_TXT_ACCOUNT="google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
npm run build
```

The build will generate `dist/ads.txt` only when `ADS_TXT_ACCOUNT` is set.
After approval and consent setup, `ADSENSE_MODE=content` permits the loader only
on maintained guide pages.

Do not publish fake AdSense IDs. Do not promise users that text can bypass AI detection. Keep ads away from buttons and tool controls after approval.

## Legacy subdomain handoff

The `threejs-lab` repository now builds noindex migration shells. Deploy the
main domain first, verify every target returns HTTP 200, and only then manually
dispatch the legacy Pages workflow. GitHub Pages does not provide a configurable
HTTP 301 in this setup, so the shells use a visible link, canonical, meta refresh,
and `location.replace` while preserving query parameters and fragments.
