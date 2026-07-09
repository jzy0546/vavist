import { mkdir, rm, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site, pathFor } from "../src/config.js";
import { healthChecks, labTools, toolExplainers } from "../src/tools.js";
import { pages } from "../src/pages.js";
import { getGuide, guides } from "../src/guides.js";
import { resourceGroups } from "../src/resources.js";

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

const slugText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const routeUrl = (route) => {
  if (route.startsWith("http") || route.startsWith("mailto:")) return route;
  if (route.startsWith("#")) return route;
  if (route === "/") return `${basePath || ""}/`;
  return `${basePath}${route}`;
};

const labHref = (route = "/") => {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  return `${site.labUrl}${normalizedRoute}`;
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
      gtag('config', '${id}', { transport_type: 'beacon' });
    </script>`;
};

const adsenseScript = () => {
  if (!site.adsenseClient) return "";
  return `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${html(site.adsenseClient)}" crossorigin="anonymous"></script>`;
};

const webPageJsonLd = ({ route, title, description }) => ({
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${pathFor(route)}#webpage`,
  url: pathFor(route),
  name: title,
  description,
  inLanguage: site.language,
  isPartOf: {
    "@type": "WebSite",
    name: site.name,
    url: pathFor("/")
  }
});

const analyticsAttrs = ({ event, label, destination = "" }) => {
  const attributes = [
    `data-analytics-event="${html(event)}"`,
    `data-analytics-label="${html(label)}"`
  ];
  if (destination) {
    attributes.push(`data-analytics-destination="${html(destination)}"`);
  }
  return ` ${attributes.join(" ")}`;
};

const nav = () => `
  <header class="site-header">
    <nav class="site-nav" aria-label="Main navigation">
      <a class="brand" href="${routeUrl("/")}" aria-label="${html(site.name)} home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>${html(site.name)}</span>
      </a>
      <button class="menu-button" type="button" data-menu-button aria-expanded="false" aria-label="Open navigation">
        <span aria-hidden="true"></span>
      </button>
      <div class="nav-links" data-menu>
        <a href="${routeUrl("/")}">Home</a>
        <a href="${routeUrl("/tools/")}">Tools</a>
        <a href="${routeUrl("/webgl-scene-health-check/")}">Checklist</a>
        <a href="${routeUrl("/guides/")}">Guides</a>
        <a href="${routeUrl("/resources/")}">Resources</a>
        <a href="${routeUrl("/about/")}">About</a>
        <a class="nav-cta" href="${html(labHref("/"))}"${analyticsAttrs({
          event: "open_lab_tool",
          label: "nav_open_lab",
          destination: labHref("/")
        })}>Open lab</a>
      </div>
    </nav>
  </header>`;

const footer = () => `
  <footer class="site-footer">
    <div class="footer-inner">
      <div>
        <strong>${html(site.name)}</strong>
        <p>${html(site.tagline)}</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href="${routeUrl("/about/")}">About</a>
        <a href="${routeUrl("/tools/")}">Tools</a>
        <a href="${routeUrl("/webgl-scene-health-check/")}">Checklist</a>
        <a href="${routeUrl("/guides/")}">Guides</a>
        <a href="${routeUrl("/resources/")}">Resources</a>
        <a href="${routeUrl("/contact/")}">Contact</a>
        <a href="${routeUrl("/privacy-policy/")}">Privacy</a>
        <a href="${routeUrl("/terms-of-use/")}">Terms</a>
        <a href="${routeUrl("/cookie-policy/")}">Cookies</a>
      </nav>
    </div>
  </footer>`;

const layout = ({ route, title, description, body, structuredData = [] }) => {
  const canonical = pathFor(route);
  const ldScripts = [webPageJsonLd({ route, title, description }), ...structuredData]
    .map(jsonLdScript)
    .join("\n");
  return `<!doctype html>
<html lang="${html(site.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${html(title)}</title>
  <meta name="description" content="${html(description)}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${html(canonical)}">
  <meta name="theme-color" content="${html(site.themeColor)}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${html(site.locale)}">
  <meta property="og:site_name" content="${html(site.name)}">
  <meta property="og:title" content="${html(title)}">
  <meta property="og:description" content="${html(description)}">
  <meta property="og:url" content="${html(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${html(title)}">
  <meta name="twitter:description" content="${html(description)}">
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
  <script type="module" src="${routeUrl("/assets/app.js")}"></script>
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

const itemList = (items, name) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name || item.title,
    url: labHref(item.path)
  }))
});

const guideItemList = (items, name) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.title,
    url: pathFor(`/guides/${item.slug}/`)
  }))
});

const toolCard = (tool, index) => `
  <a class="launch-card launch-card-${index + 1}" href="${html(labHref(tool.path))}"${analyticsAttrs({
    event: "open_lab_tool",
    label: tool.name,
    destination: labHref(tool.path)
  })} data-reveal>
    <span>${html(tool.label)}</span>
    <strong>${html(tool.name)}</strong>
    <small>${html(tool.description)}</small>
  </a>`;

const guideCard = (guide) => `
  <a class="guide-card" href="${routeUrl(`/guides/${guide.slug}/`)}"${analyticsAttrs({
    event: "open_guide",
    label: guide.slug,
    destination: pathFor(`/guides/${guide.slug}/`)
  })} data-reveal>
    <small>${html(guide.minutes)} min read · ${html(guide.tags[0])}</small>
    <strong>${html(guide.title)}</strong>
    <span>${html(guide.summary)}</span>
  </a>`;

const homeProblemRoutes = [
  {
    label: "Model looks wrong",
    title: "Inspect a GLB",
    description: "Open the viewer when scale, pivots, materials, or animation clips need a fast read.",
    href: labHref("/gltf-viewer/"),
    event: "open_lab_tool",
    eventLabel: "home_problem_glb_viewer"
  },
  {
    label: "Object will not fit",
    title: "Frame the camera",
    description: "Use bounds and field-of-view math before guessing another camera distance.",
    href: routeUrl("/guides/fit-camera-to-object-three-js/"),
    event: "open_guide",
    eventLabel: "home_problem_camera_fit"
  },
  {
    label: "Ready to ship",
    title: "Run the scene check",
    description: "Score loading, mobile performance, camera, lighting, and fallback quality.",
    href: routeUrl("/webgl-scene-health-check/"),
    event: "start_health_check",
    eventLabel: "home_problem_health_check"
  }
];

const problemRouteCard = (item) => `
  <a class="problem-route" href="${html(item.href)}"${analyticsAttrs({
    event: item.event,
    label: item.eventLabel,
    destination: item.href
  })}>
    <span>${html(item.label)}</span>
    <strong>${html(item.title)}</strong>
    <small>${html(item.description)}</small>
  </a>`;

const renderHome = () => {
  const route = "/";
  const body = `
    <section class="hero" aria-labelledby="home-title">
      <div class="hero-scene" data-scene>
        <canvas id="lab-canvas" aria-label="Interactive Three.js lab object"></canvas>
        <div class="scene-fallback" aria-hidden="true">
          <span>WebGL scene loading</span>
        </div>
      </div>
      <div class="hero-shade" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="eyebrow">Vavist main entrance</p>
        <h1 id="home-title">Three.js Lab</h1>
        <p class="hero-text">A browser-native workspace for inspecting GLB files, framing cameras, tuning shaders, and copying practical Three.js patterns.</p>
        <div class="hero-actions">
          <a class="button primary" href="${html(labHref("/gltf-viewer/"))}"${analyticsAttrs({
            event: "open_lab_tool",
            label: "hero_glb_viewer",
            destination: labHref("/gltf-viewer/")
          })}>Open GLB viewer</a>
          <a class="button secondary" href="${routeUrl("/webgl-scene-health-check/")}"${analyticsAttrs({
            event: "start_health_check",
            label: "hero_scene_check",
            destination: pathFor("/webgl-scene-health-check/")
          })}>Run scene check</a>
          <a class="button secondary" href="${routeUrl("/guides/")}"${analyticsAttrs({
            event: "open_guide_index",
            label: "hero_guides",
            destination: pathFor("/guides/")
          })}>Browse guides</a>
        </div>
        <div class="hero-router" aria-label="Start with a Three.js problem">
          ${homeProblemRoutes.map(problemRouteCard).join("\n")}
        </div>
        <dl class="hero-metrics" aria-label="Lab coverage">
          <div><dt>5</dt><dd>focused tools</dd></div>
          <div><dt>${guides.length}</dt><dd>builder guides</dd></div>
          <div><dt>1</dt><dd>publishing checklist</dd></div>
        </dl>
      </div>
    </section>

    <section class="section lab-tools" id="lab-tools">
      <div class="section-inner">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Launchpad</p>
          <h2>Open the exact bench you need.</h2>
          <p>Vavist now routes the homepage toward the Three.js Lab surface: compact browser tools for the parts of WebGL work that usually waste the most time.</p>
        </div>
        <div class="launch-grid">
          ${labTools.map(toolCard).join("\n")}
        </div>
        <div class="section-actions" data-reveal>
          <a class="button secondary" href="${routeUrl("/tools/")}">Read the tool workflows</a>
          <a class="button secondary" href="${routeUrl("/webgl-scene-health-check/")}">Check a scene before publishing</a>
        </div>
      </div>
    </section>

    <section class="section process-band">
      <div class="section-inner process-grid">
        <div data-reveal>
          <p class="eyebrow">Static by design</p>
          <h2>Fast pages, local files, readable examples.</h2>
        </div>
        <div class="principles" data-reveal>
          <p>Three.js Lab keeps the public site focused on browser graphics. The tools favor transparent math, copyable code, and client-side previews over accounts or opaque backends.</p>
          <ul>
            <li>Model inspection stays in the browser.</li>
            <li>Camera and lighting values are easy to copy.</li>
            <li>Guides target narrow Three.js search problems.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section guides" id="guides">
      <div class="section-inner">
        <div class="section-head" data-reveal>
          <p class="eyebrow">Reference routes</p>
          <h2>Guides for the problems builders actually search.</h2>
          <p>Original notes from the lab: each guide turns a common Three.js failure mode into a practical workflow, with source links for deeper reading.</p>
        </div>
        <div class="guide-grid">
          ${guides.slice(0, 6).map(guideCard).join("\n")}
        </div>
        <div class="section-actions" data-reveal>
          <a class="button secondary" href="${routeUrl("/guides/")}">View all guides</a>
        </div>
      </div>
    </section>`;

  return layout({
    route,
    title: "Three.js Lab Guides and WebGL Tools by Vavist",
    description: site.description,
    body,
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: pathFor("/"),
        description: site.description
      },
      itemList(labTools, "Three.js Lab tools"),
      guideItemList(guides, "Three.js Lab guides")
    ]
  });
};

const renderGuideIndex = () => {
  const route = "/guides/";
  const body = `
    <section class="guide-index">
      <div class="section-inner">
        <p class="eyebrow">Three.js guides</p>
        <h1>Practical WebGL notes for builders.</h1>
        <p class="hero-text">Original Three.js guides written for the problems that show up in real browser scenes: imports, cameras, shaders, lighting, responsive canvases, pivots, performance, and color.</p>
        <div class="guide-grid guide-grid-index">
          ${guides.map(guideCard).join("\n")}
        </div>
      </div>
    </section>`;

  return layout({
    route,
    title: "Three.js Guides for WebGL Builders and Tool Pages",
    description:
      "Read original Three.js guides for GLTFLoader, camera fitting, ShaderMaterial, lighting, particles, responsive canvas sizing, performance, and debugging.",
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: "Guides", route }
      ]),
      guideItemList(guides, "Three.js guides")
    ]
  });
};

const localToolCard = (tool) => `
  <article class="tool-explainer">
    <div>
      <p class="eyebrow">${html(tool.label)}</p>
      <h2>${html(tool.name)}</h2>
      <p>${html(tool.localUse)}</p>
    </div>
    <div class="tool-workflow">
      <strong>Workflow</strong>
      <ol>
        ${tool.workflow.map((step) => `<li>${html(step)}</li>`).join("\n")}
      </ol>
      <div class="tool-links">
        <a class="button primary" href="${html(labHref(tool.path))}"${analyticsAttrs({
          event: "open_lab_tool",
          label: `tools_index_${tool.name}`,
          destination: labHref(tool.path)
        })}>Open ${html(tool.name)}</a>
        ${tool.relatedGuides
          .map((slug) => {
            const guide = getGuide(slug);
            return guide
              ? `<a class="text-link" href="${routeUrl(`/guides/${guide.slug}/`)}">${html(guide.title)}</a>`
              : "";
          })
          .join("\n")}
      </div>
    </div>
  </article>`;

const renderToolsIndex = () => {
  const route = "/tools/";
  const body = `
    <section class="guide-index tool-index">
      <div class="section-inner">
        <p class="eyebrow">Three.js tools</p>
        <h1>Small benches for real WebGL problems.</h1>
        <p class="hero-text">The live tools run on the Three.js Lab subdomain, but the root site explains when to use each one, what to measure, and which guide to read next.</p>
        <div class="tool-index-actions">
          <a class="button primary" href="${routeUrl("/webgl-scene-health-check/")}"${analyticsAttrs({
            event: "start_health_check",
            label: "tools_index_health_check",
            destination: pathFor("/webgl-scene-health-check/")
          })}>Run scene health check</a>
          <a class="button secondary" href="${html(labHref("/"))}"${analyticsAttrs({
            event: "open_lab_tool",
            label: "tools_index_full_lab",
            destination: labHref("/")
          })}>Open full lab</a>
        </div>
        <div class="tool-explainer-stack">
          ${toolExplainers.map(localToolCard).join("\n")}
        </div>
      </div>
    </section>`;

  return layout({
    route,
    title: "Three.js Tools for GLB, Camera, Shaders and Lighting",
    description:
      "Use the Vavist Three.js tool index to choose a GLB viewer, camera FOV calculator, ShaderMaterial starter, lighting presets, examples, and a WebGL health checklist.",
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: "Tools", route }
      ]),
      itemList(toolExplainers, "Three.js Lab tools")
    ]
  });
};

const healthCheckInputs = () =>
  healthChecks
    .map(
      (group) => `<fieldset class="health-group">
        <legend>${html(group.group)}</legend>
        ${group.items
          .map(
            (item) => `<label class="health-option">
              <input type="checkbox" data-health-item data-points="${html(item.points)}" data-label="${html(item.label)}">
              <span>${html(item.label)}</span>
              <strong>${html(item.points)}</strong>
            </label>`
          )
          .join("\n")}
      </fieldset>`
    )
    .join("\n");

const renderHealthCheck = () => {
  const route = "/webgl-scene-health-check/";
  const body = `
    <section class="health-page">
      <div class="section-inner health-layout" data-health-check>
        <header class="health-header">
          <p class="eyebrow">Interactive checklist</p>
          <h1>WebGL scene health check</h1>
          <p class="hero-text">Score a Three.js scene before publishing. The checklist focuses on the failure modes that make WebGL pages feel unfinished: invisible models, broken camera framing, heavy assets, weak loading states, and mobile performance surprises.</p>
        </header>
        <aside class="health-result" aria-live="polite">
          <span>Scene readiness</span>
          <strong data-health-score>0</strong>
          <p data-health-status>Start checking the items that are true for your scene.</p>
          <div class="health-meter"><i data-health-meter></i></div>
          <button class="button primary" type="button" data-health-copy>Copy recommendations</button>
          <p class="status" data-health-message></p>
        </aside>
        <form class="health-form">
          ${healthCheckInputs()}
        </form>
        <section class="article-section health-notes">
          <h2>How to read the score</h2>
          <p>A high score does not mean the scene is visually finished. It means the technical surface is less likely to break under real page conditions. Use the result as a publishing gate before you add more polish.</p>
          <p>Scores below 55 usually mean the scene still has structural risk. Scores between 55 and 79 are workable but need mobile and loading checks. Scores at 80 or above are ready for design review, copy review, and real-device testing.</p>
          <div class="guide-grid">
            ${["three-js-mobile-performance-checklist", "three-js-scene-debugging-checklist", "three-js-performance-budget"]
              .map((slug) => guideCard(getGuide(slug)))
              .join("\n")}
          </div>
        </section>
      </div>
    </section>`;

  return layout({
    route,
    title: "WebGL Scene Health Check: Three.js Publishing Checklist",
    description:
      "Run a browser-only WebGL scene health check for Three.js assets, camera framing, rendering, mobile performance, loading states, and publishing readiness.",
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: "WebGL Scene Health Check", route }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "WebGL Scene Health Check",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: pathFor(route),
        description:
          "Browser-only checklist for scoring Three.js scene readiness before publishing.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        }
      }
    ]
  });
};

const renderResources = () => {
  const route = "/resources/";
  const body = `
    <section class="guide-index resources-page">
      <div class="section-inner">
        <p class="eyebrow">Reference library</p>
        <h1>Primary sources for Three.js builders.</h1>
        <p class="hero-text">Vavist articles are written from practical testing and primary documentation. This page collects the references used most often when a WebGL scene needs accurate API behavior, browser constraints, asset-format context, or publishing guidance.</p>
        <div class="resource-grid">
          ${resourceGroups
            .map(
              (group) => `<article class="resource-card">
                <h2>${html(group.name)}</h2>
                <p>${html(group.description)}</p>
                <ul>
                  ${group.links
                    .map((link) => `<li><a href="${html(link.url)}">${html(link.label)}</a></li>`)
                    .join("\n")}
                </ul>
              </article>`
            )
            .join("\n")}
        </div>
        <section class="article-section">
          <h2>How these references are used</h2>
          <p>Vavist does not copy documentation into article pages. The guides translate recurring Three.js problems into checklists, workflows, and small code patterns, then link back to the primary source when API behavior matters. That keeps each page useful as an explanation while still making it easy to verify details against the official docs.</p>
          <p>When a topic depends on browser behavior, MDN is treated as the source of truth. When a topic depends on asset format, Khronos glTF material is preferred. When a topic depends on advertising or search review, Google documentation is cited directly. This source hierarchy keeps the site practical without turning it into a pile of unsupported tips.</p>
        </section>
      </div>
    </section>`;

  return layout({
    route,
    title: "Three.js Resources: Official References for WebGL Builders",
    description:
      "Primary Three.js, MDN, Khronos glTF, Google Search, and AdSense references used by Vavist WebGL guides.",
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: "Resources", route }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Three.js Resources",
        url: pathFor(route),
        description:
          "Primary references for Three.js, WebGL browser behavior, asset formats, and publishing quality."
      }
    ]
  });
};

const relatedGuides = (guide) => {
  const index = guides.findIndex((item) => item.slug === guide.slug);
  return guides
    .filter((item) => item.slug !== guide.slug)
    .slice(index + 1)
    .concat(guides.slice(0, index))
    .slice(0, 3);
};

const adjacentGuides = (guide) => {
  const index = guides.findIndex((item) => item.slug === guide.slug);
  const previous = guides[(index - 1 + guides.length) % guides.length];
  const next = guides[(index + 1) % guides.length];
  return { previous, next };
};

const nextStepForGuide = (guide) => {
  const text = `${guide.slug} ${guide.title} ${guide.tags.join(" ")}`.toLowerCase();
  if (text.includes("gltf") || text.includes("glb") || text.includes("texture") || text.includes("environment")) {
    return {
      eyebrow: "Related lab bench",
      title: "Inspect the asset in the GLB Viewer",
      description:
        "Use the live viewer to check bounds, material readability, animation clips, and model scale before the scene becomes harder to debug.",
      href: labHref("/gltf-viewer/"),
      cta: "Open GLB Viewer",
      event: "open_lab_tool",
      label: `guide_next_step_${guide.slug}_glb_viewer`
    };
  }
  if (text.includes("camera") || text.includes("responsive") || text.includes("orbitcontrols")) {
    return {
      eyebrow: "Related lab bench",
      title: "Calculate the camera framing",
      description:
        "Move from the guide to the camera calculator when you need a repeatable distance, field of view, or viewport coverage target.",
      href: labHref("/camera-fov/"),
      cta: "Open Camera FOV",
      event: "open_lab_tool",
      label: `guide_next_step_${guide.slug}_camera_fov`
    };
  }
  if (text.includes("shader")) {
    return {
      eyebrow: "Related lab bench",
      title: "Start from a visible ShaderMaterial",
      description:
        "Use the shader starter when you want a small baseline that proves uniforms, UVs, and animation time are flowing.",
      href: labHref("/shader-starter/"),
      cta: "Open Shader Starter",
      event: "open_lab_tool",
      label: `guide_next_step_${guide.slug}_shader_starter`
    };
  }
  if (text.includes("light") || text.includes("shadow") || text.includes("color")) {
    return {
      eyebrow: "Related lab bench",
      title: "Compare lighting presets",
      description:
        "Use the lighting presets when a model is readable in code but still looks black, flat, or too dramatic in the browser.",
      href: labHref("/lighting-presets/"),
      cta: "Open Lighting Presets",
      event: "open_lab_tool",
      label: `guide_next_step_${guide.slug}_lighting_presets`
    };
  }
  return {
    eyebrow: "Publishing gate",
    title: "Run the WebGL scene health check",
    description:
      "Use the checklist to score assets, camera behavior, rendering, mobile performance, loading states, and fallback content before publishing.",
    href: routeUrl("/webgl-scene-health-check/"),
    cta: "Run Scene Check",
    event: "start_health_check",
    label: `guide_next_step_${guide.slug}_health_check`
  };
};

const renderGuideNextStep = (guide) => {
  const step = nextStepForGuide(guide);
  const secondary =
    step.event === "start_health_check"
      ? {
          href: routeUrl("/tools/"),
          event: "open_tools_index",
          label: `guide_next_step_${guide.slug}_secondary_tools`,
          destination: pathFor("/tools/"),
          cta: "Compare lab tools"
        }
      : {
          href: routeUrl("/webgl-scene-health-check/"),
          event: "start_health_check",
          label: `guide_next_step_${guide.slug}_secondary_health_check`,
          destination: pathFor("/webgl-scene-health-check/"),
          cta: "Check before publishing"
        };
  return `
    <section class="article-next-step">
      <div>
        <p class="eyebrow">${html(step.eyebrow)}</p>
        <h2>${html(step.title)}</h2>
        <p>${html(step.description)}</p>
      </div>
      <div class="article-next-step-actions">
        <a class="button primary" href="${html(step.href)}"${analyticsAttrs({
          event: step.event,
          label: step.label,
          destination: step.href
        })}>${html(step.cta)}</a>
        <a class="button secondary" href="${html(secondary.href)}"${analyticsAttrs(secondary)}>${html(secondary.cta)}</a>
      </div>
    </section>`;
};

const faqsForGuide = (guide) => [
  {
    q: `When should I use ${guide.title}?`,
    a: `Use it when your Three.js scene has a focused ${guide.tags[0] || "WebGL"} problem and you need a practical checklist before adding more visual polish.`
  },
  {
    q: "Is the code snippet production-ready?",
    a: "Treat the snippet as a clear starting point. Test it in your scene, adapt naming and paths, and verify behavior on mobile hardware before publishing."
  },
  {
    q: "What should I check after applying this guide?",
    a: "Run the scene through mobile sizing, console errors, loading states, source links, and related guide paths so the page remains useful even when assets or WebGL fail."
  }
];

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

const renderToc = (guide) => {
  const items = [
    ...guide.sections.map((section) => section.heading),
    "When this guide is the right tool",
    "Common mistake to avoid",
    "Publishing check",
    guide.code.label,
    "FAQ",
    "Sources and further reading"
  ];

  return `<nav class="article-toc" aria-label="Article sections">
    <span>On this page</span>
    ${items.map((item) => `<a href="#${slugText(item)}">${html(item)}</a>`).join("\n")}
  </nav>`;
};

const renderGuideFieldNotes = (guide) => {
  const primaryTag = guide.tags[0] || "Three.js";
  const mainTakeaway = guide.takeaways[0] || guide.summary;
  const secondTakeaway = guide.takeaways[1] || guide.summary;
  const thirdTakeaway = guide.takeaways[2] || guide.summary;

  return `
    <section class="article-section field-notes" id="when-this-guide-is-the-right-tool">
      <h2>When this guide is the right tool</h2>
      <p>Use this guide when the problem is specific enough that a broad Three.js tutorial would waste time. The focus here is ${html(primaryTag)} in a real browser page: what to check first, what to measure, and what to avoid before the scene becomes harder to reason about.</p>
      <p>The practical rule is simple: ${html(mainTakeaway)} If that sentence describes the scene in front of you, treat the article as a checklist. Read the explanation, copy the smallest useful code pattern, then test the result in a narrow mobile viewport and a wide desktop viewport before adding more polish.</p>
    </section>
    <section class="article-section field-notes" id="common-mistake-to-avoid">
      <h2>Common mistake to avoid</h2>
      <p>The common mistake is treating ${html(guide.title)} as a visual tweak instead of a scene-system decision. Three.js problems often look like one broken line of code, but the actual issue is usually a chain: asset assumptions, renderer settings, camera math, material setup, interaction state, and page layout all meet inside the canvas.</p>
      <p>That is why the safest fix is incremental. Start from a known-good scene, change one variable, and keep a visible diagnostic while testing. ${html(secondTakeaway)} When the scene works, remove temporary helpers and leave behind only the checks that make sense for users.</p>
    </section>
    <section class="article-section field-notes" id="publishing-check">
      <h2>Publishing check</h2>
      <p>Before publishing, run the scene through three questions. Does the page remain useful if WebGL fails or the asset loads slowly? Does the same scene still read clearly on a phone? Can another developer understand the important settings without reverse-engineering the whole file?</p>
      <p>The last pass should be boring on purpose: verify canvas size, console errors, mobile performance, source links, internal links, and the related guide path. ${html(thirdTakeaway)} If any answer is fuzzy, fix that before introducing a new effect or a larger asset.</p>
    </section>`;
};

const renderGuide = (guide) => {
  const route = `/guides/${guide.slug}/`;
  const related = relatedGuides(guide);
  const adjacent = adjacentGuides(guide);
  const faqs = faqsForGuide(guide);
  const body = `
    <article class="guide-page">
      <div class="article-shell">
        <header class="article-header">
          <a class="back-link" href="${routeUrl("/guides/")}">All guides</a>
          <p class="eyebrow">${html(guide.tags.join(" / "))}</p>
          <h1>${html(guide.title)}</h1>
          <p class="article-summary">${html(guide.summary)}</p>
          <div class="guide-meta">
            <span>Updated ${html(guide.updated)}</span>
            <span>${html(guide.minutes)} min read</span>
          </div>
        </header>
        <aside class="takeaway-panel">
          <strong>Takeaways</strong>
          <ul>
            ${guide.takeaways.map((item) => `<li>${html(item)}</li>`).join("\n")}
          </ul>
          ${renderToc(guide)}
        </aside>
        <div class="article-body">
          ${renderGuideNextStep(guide)}
          ${guide.sections
            .map(
              (section) => `<section class="article-section" id="${slugText(section.heading)}">
                <h2>${html(section.heading)}</h2>
                ${section.paragraphs.map((paragraph) => `<p>${html(paragraph)}</p>`).join("\n")}
              </section>`
            )
            .join("\n")}
          ${renderGuideFieldNotes(guide)}
          <section class="article-section" id="${slugText(guide.code.label)}">
            <h2>${html(guide.code.label)}</h2>
            <pre class="article-code"><code>${html(guide.code.value)}</code></pre>
          </section>
          <section class="article-section" id="faq">
            <h2>FAQ</h2>
            <div class="faq-list">
              ${faqs
                .map((faq) => `<details>
                  <summary>${html(faq.q)}</summary>
                  <p>${html(faq.a)}</p>
                </details>`)
                .join("\n")}
            </div>
          </section>
          <section class="article-section" id="sources-and-further-reading">
            <h2>Sources and further reading</h2>
            <ul class="source-list">
              ${guide.sources
                .map((source) => `<li><a href="${html(source.url)}">${html(source.label)}</a></li>`)
                .join("\n")}
            </ul>
          </section>
          <nav class="article-neighbors" aria-label="Adjacent guides">
            <a href="${routeUrl(`/guides/${adjacent.previous.slug}/`)}"><span>Previous</span><strong>${html(adjacent.previous.title)}</strong></a>
            <a href="${routeUrl(`/guides/${adjacent.next.slug}/`)}"><span>Next</span><strong>${html(adjacent.next.title)}</strong></a>
          </nav>
          <section class="article-section related-guides">
            <h2>Related guides</h2>
            <div class="guide-grid">
              ${related.map(guideCard).join("\n")}
            </div>
          </section>
        </div>
      </div>
    </article>`;

  return layout({
    route,
    title: guide.title,
    description: guide.description,
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: "Guides", route: "/guides/" },
        { name: guide.title, route }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        datePublished: guide.updated,
        dateModified: guide.updated,
        author: {
          "@type": "Organization",
          name: site.author
        },
        publisher: {
          "@type": "Organization",
          name: site.author
        },
        mainEntityOfPage: pathFor(route)
      },
      faqJsonLd(faqs)
    ]
  });
};

const renderStaticPage = (page) => {
  const route = `/${page.slug}/`;
  const body = `
    <section class="content-page">
      <div class="content-inner">
        <p class="eyebrow">${html(site.name)}</p>
        <h1>${html(page.h1)}</h1>
        ${page.body
          .map((paragraph) =>
            `<p>${html(paragraph.replaceAll("{{contactEmail}}", site.contactEmail))}</p>`
          )
          .join("\n")}
      </div>
    </section>`;

  return layout({
    route,
    title: page.title,
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

const renderNotFound = () => {
  const route = "/404/";
  const body = `
    <section class="content-page not-found-page">
      <div class="content-inner">
        <p class="eyebrow">404</p>
        <h1>This scene is outside the camera frustum.</h1>
        <p>The page you requested is not available. Return to the lab entrance, browse the guides, or run the WebGL scene checklist if you were looking for a debugging path.</p>
        <div class="hero-actions">
          <a class="button primary" href="${routeUrl("/")}">Go home</a>
          <a class="button secondary" href="${routeUrl("/guides/")}">Browse guides</a>
          <a class="button secondary" href="${routeUrl("/webgl-scene-health-check/")}">Run checklist</a>
        </div>
      </div>
    </section>`;

  return layout({
    route,
    title: "Page Not Found: Three.js Lab and Vavist",
    description:
      "The requested page was not found. Return to Three.js Lab tools, guides, and the WebGL scene health checklist.",
    body,
    structuredData: [
      breadcrumb([
        { name: "Home", route: "/" },
        { name: "404", route }
      ])
    ]
  });
};

const allRoutes = () => [
  "/",
  "/tools/",
  "/webgl-scene-health-check/",
  "/resources/",
  "/guides/",
  ...guides.map((guide) => `/guides/${guide.slug}/`),
  ...pages.map((page) => `/${page.slug}/`),
  "/404/"
];

const sitemapRoutes = () => allRoutes().filter((route) => route !== "/404/");

const robots = () => `User-agent: *
Allow: /

Sitemap: ${pathFor("/sitemap.xml")}
`;

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes()
  .map(
    (route) => `  <url>
    <loc>${html(pathFor(route))}</loc>
    <lastmod>${buildDate}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>
`;

const adsTxt = () => {
  if (!site.adsTxtAccount) return "";
  if (site.adsTxtAccount.includes(",")) return `${site.adsTxtAccount}\n`;
  return `google.com, ${site.adsTxtAccount}, DIRECT, f08c47fec0942fa0\n`;
};

const copyAssets = async () => {
  const outputAssets = path.join(distDir, "assets");
  await mkdir(outputAssets, { recursive: true });
  await copyFile(path.join(srcDir, "assets", "styles.css"), path.join(outputAssets, "styles.css"));
  await copyFile(path.join(srcDir, "assets", "app.js"), path.join(outputAssets, "app.js"));
  await copyFile(path.join(srcDir, "assets", "analytics.js"), path.join(outputAssets, "analytics.js"));
  await copyFile(path.join(srcDir, "assets", "site-icon.svg"), path.join(outputAssets, "site-icon.svg"));
};

const build = async () => {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await copyAssets();
  await writeRoute("/", renderHome());
  await writeRoute("/tools/", renderToolsIndex());
  await writeRoute("/webgl-scene-health-check/", renderHealthCheck());
  await writeRoute("/resources/", renderResources());
  await writeRoute("/guides/", renderGuideIndex());

  for (const guide of guides) {
    await writeRoute(`/guides/${guide.slug}/`, renderGuide(guide));
  }

  for (const page of pages) {
    await writeRoute(`/${page.slug}/`, renderStaticPage(page));
  }

  const notFound = renderNotFound();
  await writeRoute("/404/", notFound);
  await writeFile(path.join(distDir, "404.html"), notFound, "utf8");

  await writeFile(path.join(distDir, "robots.txt"), robots(), "utf8");
  await writeFile(path.join(distDir, "sitemap.xml"), sitemap(), "utf8");

  if (site.customDomain) {
    await writeFile(path.join(distDir, "CNAME"), `${site.customDomain}\n`, "utf8");
  }

  if (site.adsTxtAccount) {
    await writeFile(path.join(distDir, "ads.txt"), adsTxt(), "utf8");
  }

  console.log(`Built ${allRoutes().length} pages in dist/`);
};

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
