import { mkdir, rm, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, pathFor } from "../src/config.js";
import { tools, getTool } from "../src/tools.js";
import { pages } from "../src/pages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const srcDir = path.join(rootDir, "src");
const buildDate = new Date().toISOString().slice(0, 10);

const basePath = (() => {
  try {
    const pathname = new URL(site.url).pathname.replace(/\/+$/, "");
    return pathname === "/" ? "" : pathname;
  } catch {
    return "";
  }
})();

const html = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const routeUrl = (route) => {
  if (route.startsWith("http") || route.startsWith("mailto:")) return route;
  if (route === "/") return `${basePath || ""}/`;
  return `${basePath}${route}`;
};

const outPathForRoute = (route) => {
  if (route === "/") return path.join(distDir, "index.html");
  return path.join(distDir, route.replace(/^\/|\/$/g, ""), "index.html");
};

const writeRoute = async (route, content) => {
  const filePath = outPathForRoute(route);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf8");
};

const jsonLdScript = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

const analyticsScript = () => {
  if (!site.gaMeasurementId) return "";
  const id = html(site.gaMeasurementId);
  return `
    <script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    </script>`;
};

const adsenseScript = () => {
  if (!site.adsenseClient) return "";
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${html(site.adsenseClient)}" crossorigin="anonymous"></script>`;
};

const nav = () => `
  <header class="site-header">
    <a class="brand" href="${routeUrl("/")}" aria-label="${html(site.name)} home">
      <span class="brand-mark">PM</span>
      <span>${html(site.name)}</span>
    </a>
    <nav class="nav-links" aria-label="Primary navigation">
      <a href="${routeUrl("/tools/ai-prompt-generator/")}">Prompt</a>
      <a href="${routeUrl("/tools/ai-image-prompt-generator/")}">Image</a>
      <a href="${routeUrl("/tools/ai-token-counter/")}">Token</a>
      <a href="${routeUrl("/about/")}">About</a>
    </nav>
  </header>`;

const footer = () => `
  <footer class="site-footer">
    <div>
      <strong>${html(site.name)}</strong>
      <p>${html(site.tagline)}</p>
    </div>
    <nav aria-label="Footer navigation">
      <a href="${routeUrl("/privacy-policy/")}">Privacy</a>
      <a href="${routeUrl("/terms-of-use/")}">Terms</a>
      <a href="${routeUrl("/cookie-policy/")}">Cookies</a>
      <a href="${routeUrl("/contact/")}">Contact</a>
    </nav>
  </footer>`;

const layout = ({ route, title, description, body, structuredData = [] }) => {
  const canonical = pathFor(route);
  const ldScripts = structuredData.map(jsonLdScript).join("\n");
  return `<!doctype html>
<html lang="${html(site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${html(title)}</title>
  <meta name="description" content="${html(description)}">
  <link rel="canonical" href="${html(canonical)}">
  <meta name="theme-color" content="${html(site.themeColor)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${html(site.locale)}">
  <meta property="og:site_name" content="${html(site.name)}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${html(description)}">
  <meta property="og:url" content="${html(canonical)}">
  <link rel="icon" href="${routeUrl("/assets/site-icon.svg")}" type="image/svg+xml">
  <link rel="stylesheet" href="${routeUrl("/assets/styles.css")}">
  ${analyticsScript()}
  ${adsenseScript()}
  ${ldScripts}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${nav()}
  <main id="main">
    ${body}
  </main>
  ${footer()}
  <script src="${routeUrl("/assets/app.js")}" defer></script>
</body>
</html>`;
};

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: pathFor(item.route)
  }))
});

const faqJsonLd = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a
    }
  }))
});

const softwareJsonLd = (tool, route) => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: tool.title,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  url: pathFor(route),
  description: tool.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD"
  }
});

const toolCard = (tool) => `
  <a class="tool-card" href="${routeUrl(`/tools/${tool.slug}/`)}">
    <span>${html(tool.navLabel)}</span>
    <strong>${html(tool.title)}</strong>
    <small>${html(tool.description)}</small>
  </a>`;

const renderHome = () => {
  const route = "/";
  const body = `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Free AI utility tools</p>
        <h1>Better prompts before you open your AI assistant.</h1>
        <p class="hero-text">${html(site.description)}</p>
        <div class="hero-actions">
          <a class="button primary" href="${routeUrl("/tools/ai-prompt-generator/")}">Start with prompts</a>
          <a class="button secondary" href="${routeUrl("/tools/ai-token-counter/")}">Estimate tokens</a>
        </div>
      </div>
      <div class="hero-panel" aria-label="Prompt quality checklist">
        <span>Prompt checklist</span>
        <ol>
          <li>Define the role</li>
          <li>Add context</li>
          <li>Choose output format</li>
          <li>Set limits</li>
          <li>Ask for review</li>
        </ol>
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <h2>Launch tools</h2>
        <p>Five focused pages to test search demand before expanding the site.</p>
      </div>
      <div class="tool-grid">
        ${tools.map(toolCard).join("\n")}
      </div>
    </section>
    <section class="section split-section">
      <div>
        <h2>Built for a real MVP</h2>
        <p>PromptMint starts small so search data can guide the next set of pages. The tools run locally, load fast, and do not require sign-up.</p>
      </div>
      <ul class="plain-list">
        <li>Browser-only tools</li>
        <li>Search-friendly static pages</li>
        <li>No API keys or user accounts</li>
        <li>Ready for GitHub Pages</li>
      </ul>
    </section>`;

  return layout({
    route,
    title: `${site.name}: Free AI Prompt Tools`,
    description: site.description,
    body,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: pathFor("/"),
        description: site.description
      }
    ]
  });
};

const promptForm = (tool) => `
  <div class="field-grid">
    <label>Topic or task
      <input data-role="topic" value="${html(tool.example.topic || "")}" placeholder="Describe the task you want help with">
    </label>
    <label>Tone
      <select data-role="tone">
        <option>Clear and practical</option>
        <option>Friendly and concise</option>
        <option>Expert and analytical</option>
        <option>Creative and exploratory</option>
      </select>
    </label>
    <label>Output format
      <select data-role="format">
        <option>Checklist</option>
        <option>Step-by-step plan</option>
        <option>Table</option>
        <option>Draft text</option>
      </select>
    </label>
    <label class="wide">Extra context
      <textarea data-role="context" rows="5" placeholder="Audience, constraints, examples, or details">${html(tool.example.context || "")}</textarea>
    </label>
  </div>`;

const imagePromptForm = (tool) => `
  <div class="field-grid">
    <label>Subject
      <input data-role="subject" value="${html(tool.example.subject || "")}" placeholder="Main subject of the image">
    </label>
    <label>Style
      <select data-role="style">
        <option>Realistic editorial photo</option>
        <option>Cinematic concept art</option>
        <option>Clean product render</option>
        <option>Minimal poster design</option>
      </select>
    </label>
    <label>Lighting
      <select data-role="lighting">
        <option>Soft natural light</option>
        <option>High contrast studio light</option>
        <option>Golden hour</option>
        <option>Moody low light</option>
      </select>
    </label>
    <label class="wide">Details
      <textarea data-role="context" rows="5" placeholder="Composition, camera, colors, mood, and details to avoid">${html(tool.example.context || "")}</textarea>
    </label>
  </div>`;

const tokenCounterForm = (tool) => `
  <label class="wide">Text to estimate
    <textarea data-role="source" rows="10" placeholder="Paste text here">${html(tool.example.text || "")}</textarea>
  </label>
  <div class="metric-grid" aria-live="polite">
    <div><span data-metric="tokens">0</span><small>Estimated tokens</small></div>
    <div><span data-metric="words">0</span><small>Words</small></div>
    <div><span data-metric="chars">0</span><small>Characters</small></div>
    <div><span data-metric="reading">0 min</span><small>Reading time</small></div>
  </div>`;

const textCleanerForm = (tool) => `
  <label class="wide">Messy text
    <textarea data-role="source" rows="10" placeholder="Paste text here">${html(tool.example.text || "")}</textarea>
  </label>
  <fieldset class="option-row">
    <legend>Cleanup options</legend>
    <label><input type="checkbox" data-option="trimLines" checked> Trim lines</label>
    <label><input type="checkbox" data-option="collapseSpaces" checked> Collapse spaces</label>
    <label><input type="checkbox" data-option="normalizeQuotes" checked> Normalize quotes</label>
    <label><input type="checkbox" data-option="blankLines" checked> Reduce blank lines</label>
  </fieldset>`;

const formForTool = (tool) => {
  if (tool.type === "imagePrompt") return imagePromptForm(tool);
  if (tool.type === "tokenCounter") return tokenCounterForm(tool);
  if (tool.type === "textCleaner") return textCleanerForm(tool);
  return promptForm(tool);
};

const renderTool = (tool) => {
  const route = `/tools/${tool.slug}/`;
  const related = tool.related.map(getTool).filter(Boolean);
  const body = `
    <section class="tool-hero">
      <p class="eyebrow">${html(tool.primaryKeyword)}</p>
      <h1>${html(tool.h1)}</h1>
      <p>${html(tool.intro)}</p>
    </section>
    <section class="tool-shell" data-tool="${html(tool.slug)}">
      <div class="tool-inputs">
        ${formForTool(tool)}
        <div class="action-row">
          <button class="button primary" type="button" data-action="generate">Generate</button>
          <button class="button secondary" type="button" data-action="example">Example</button>
          <button class="button secondary" type="button" data-action="clear">Clear</button>
        </div>
      </div>
      <div class="tool-output">
        <div class="output-head">
          <h2>Result</h2>
          <button class="copy-button" type="button" data-action="copy">Copy</button>
        </div>
        <textarea data-role="output" rows="14" readonly placeholder="Your result will appear here"></textarea>
        <p class="status" data-role="status" aria-live="polite"></p>
      </div>
    </section>
    <section class="section split-section">
      <div>
        <h2>How to use this tool</h2>
        <p>Start with a concrete task, add the audience or situation, choose a format, then copy the result into your AI assistant or editor.</p>
      </div>
      <ul class="plain-list">
        <li>Keep private data out of prompts.</li>
        <li>Review all generated output before using it.</li>
        <li>Adjust examples and constraints for your real task.</li>
      </ul>
    </section>
    <section class="section">
      <div class="section-head">
        <h2>Frequently asked questions</h2>
      </div>
      <div class="faq-list">
        ${tool.faqs
          .map(
            (faq) => `<details><summary>${html(faq.q)}</summary><p>${html(faq.a)}</p></details>`
          )
          .join("\n")}
      </div>
    </section>
    <section class="section">
      <div class="section-head">
        <h2>Related tools</h2>
      </div>
      <div class="tool-grid compact">
        ${related.map(toolCard).join("\n")}
      </div>
    </section>`;

  return layout({
    route,
    title: `${tool.title}: Free Online Tool`,
    description: tool.description,
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: tool.title, route }
      ]),
      softwareJsonLd(tool, route),
      faqJsonLd(tool.faqs)
    ]
  });
};

const renderStaticPage = (page) => {
  const route = `/${page.slug}/`;
  const body = `
    <section class="content-page">
      <p class="eyebrow">${html(site.name)}</p>
      <h1>${html(page.h1)}</h1>
      ${page.body
        .map((paragraph) =>
          `<p>${html(paragraph.replaceAll("{{contactEmail}}", site.contactEmail))}</p>`
        )
        .join("\n")}
    </section>`;

  return layout({
    route,
    title: `${page.title}: ${site.name}`,
    description: page.description,
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: page.title, route }
      ])
    ]
  });
};

const allRoutes = () => [
  "/",
  ...tools.map((tool) => `/tools/${tool.slug}/`),
  ...pages.map((page) => `/${page.slug}/`)
];

const robots = () => `User-agent: *
Allow: /

Sitemap: ${pathFor("/sitemap.xml")}
`;

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes()
  .map(
    (route) => `  <url>
    <loc>${html(pathFor(route))}</loc>
    <lastmod>${buildDate}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const copyAssets = async () => {
  const outputAssets = path.join(distDir, "assets");
  await mkdir(outputAssets, { recursive: true });
  await copyFile(path.join(srcDir, "assets", "styles.css"), path.join(outputAssets, "styles.css"));
  await copyFile(path.join(srcDir, "assets", "app.js"), path.join(outputAssets, "app.js"));
  await copyFile(path.join(srcDir, "assets", "site-icon.svg"), path.join(outputAssets, "site-icon.svg"));
};

const build = async () => {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await copyAssets();
  await writeRoute("/", renderHome());

  for (const tool of tools) {
    await writeRoute(`/tools/${tool.slug}/`, renderTool(tool));
  }

  for (const page of pages) {
    await writeRoute(`/${page.slug}/`, renderStaticPage(page));
  }

  await writeFile(path.join(distDir, "robots.txt"), robots(), "utf8");
  await writeFile(path.join(distDir, "sitemap.xml"), sitemap(), "utf8");

  if (site.customDomain) {
    await writeFile(path.join(distDir, "CNAME"), `${site.customDomain}\n`, "utf8");
  }

  if (site.adsTxtAccount) {
    await writeFile(path.join(distDir, "ads.txt"), `${site.adsTxtAccount}\n`, "utf8");
  }

  console.log(`Built ${allRoutes().length} pages in dist/`);
};

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
