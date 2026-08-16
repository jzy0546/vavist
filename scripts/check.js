import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pages } from "../src/pages.js";
import { guides, retiredGuides } from "../src/guides.js";
import { pathFor } from "../src/config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const toolRoutes = [
  "/tools/gltf-viewer/",
  "/tools/camera-fov/",
  "/tools/shader-starter/",
  "/tools/lighting-presets/",
  "/tools/examples/"
];

const indexableRoutes = [
  "/",
  "/tools/",
  ...toolRoutes,
  "/webgl-scene-health-check/",
  "/resources/",
  "/guides/",
  ...guides.map((guide) => `/guides/${guide.slug}/`),
  ...pages.map((page) => `/${page.slug}/`),
  "/authors/jzy/"
];

const retiredRoutes = retiredGuides.map((guide) => `/guides/${guide.slug}/`);

const requiredRoutes = [
  ...indexableRoutes,
  ...retiredRoutes,
  "/404/"
];

const sitemapRoutes = indexableRoutes;

const fail = (message) => {
  throw new Error(message);
};

const exists = async (filePath) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const fileForRoute = (route) => {
  if (route === "/") return path.join(distDir, "index.html");
  return path.join(distDir, route.replace(/^\/|\/$/g, ""), "index.html");
};

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(fullPath) : fullPath;
    })
  );
  return files.flat();
};

const normalizeRoute = (href) => {
  if (!href || href.startsWith("#")) return null;
  if (/^(https?:|mailto:|tel:)/.test(href)) return null;
  const clean = href.split("#")[0].split("?")[0];
  return clean || "/";
};

const targetExists = async (href) => {
  const clean = normalizeRoute(href);
  if (!clean) return true;

  if (clean.startsWith("/assets/")) {
    return exists(path.join(distDir, clean.replace(/^\//, "")));
  }

  if (clean.endsWith(".xml") || clean.endsWith(".txt")) {
    return exists(path.join(distDir, clean.replace(/^\//, "")));
  }

  if (path.extname(clean)) {
    return exists(path.join(distDir, clean.replace(/^\//, "")));
  }

  if (clean === "/") return exists(path.join(distDir, "index.html"));
  return exists(path.join(distDir, clean.replace(/^\/|\/$/g, ""), "index.html"));
};

const metaContent = (content, attribute, value) =>
  content.match(new RegExp(`<meta ${attribute}="${value}" content="([^"]+)">`))?.[1] || "";

const bannedPublicPhrases = [
  /search-friendly pages/i,
  /easier to rank/i,
  /guides people search for/i,
  /search suggestions/i,
  /searchable learning anchors/i,
  /useful search pages/i,
  /target narrow .* search problems/i
];

const checkHtml = async (
  filePath,
  route,
  { expectedRobots = "index,follow", expectedCanonical = pathFor(route), toolPage = false } = {}
) => {
  const content = await readFile(filePath, "utf8");
  const relative = path.relative(distDir, filePath);

  if (bannedPublicPhrases.some((pattern) => pattern.test(content))) {
    fail(`${relative} contains public search-ranking copy`);
  }

  if (!/<title>[^<]+<\/title>/.test(content)) fail(`${relative} is missing title`);
  const title = content.match(/<title>([^<]+)<\/title>/)?.[1] || "";
  if (expectedRobots === "index,follow" && (title.length < 30 || title.length > 70)) {
    fail(`${relative} title should be 30-70 characters, found ${title.length}`);
  }

  if (!/<meta name="description" content="[^"]+"\s*\/?>/.test(content)) {
    fail(`${relative} is missing meta description`);
  }
  const description =
    content.match(/<meta name="description" content="([^"]+)"\s*\/?>/)?.[1] || "";
  if (expectedRobots === "index,follow" && (description.length < 80 || description.length > 170)) {
    fail(`${relative} description should be 80-170 characters, found ${description.length}`);
  }

  const h1s = [...content.matchAll(/<h1\b[^>]*>[\s\S]*?<\/h1>/g)];
  if (h1s.length !== 1) fail(`${relative} should have exactly one h1, found ${h1s.length}`);
  const canonical =
    content.match(/<link rel="canonical" href="([^"]+)"\s*\/?>/)?.[1] || "";
  if (!canonical) {
    fail(`${relative} is missing canonical`);
  }
  if (canonical !== expectedCanonical) {
    fail(`${relative} canonical should be ${expectedCanonical}, found ${canonical}`);
  }
  if (!new RegExp(`<meta name="robots" content="${expectedRobots}"\\s*\\/?>`).test(content)) {
    fail(`${relative} is missing ${expectedRobots} robots meta`);
  }
  if (
    expectedRobots === "index,follow" &&
    /<meta name="robots" content="[^"]*noindex/i.test(content)
  ) {
    fail(`${relative} contains a noindex robots directive`);
  }

  const jsonBlocks = [
    ...content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)
  ];
  if (jsonBlocks.length === 0) fail(`${relative} is missing JSON-LD`);
  for (const block of jsonBlocks) {
    const data = JSON.parse(block[1]);
    if (data["@type"] === "FAQPage") fail(`${relative} contains standalone FAQPage schema`);
  }

  const article = jsonBlocks
    .map((block) => JSON.parse(block[1]))
    .find((data) => data["@type"] === "Article");
  const guide = guides.find((item) => route === `/guides/${item.slug}/`);
  if (guide) {
    if (!article) fail(`${relative} is missing Article JSON-LD`);
    if (article.datePublished !== guide.published) {
      fail(`${relative} Article datePublished should be ${guide.published}`);
    }
    if (article.dateModified !== guide.updated) {
      fail(`${relative} Article dateModified should be ${guide.updated}`);
    }
  }

  if (!toolPage) {
    const socialImage = pathFor("/assets/social-card.png");
    if (metaContent(content, "property", "og:image") !== socialImage) {
      fail(`${relative} has an invalid or missing og:image`);
    }
    if (metaContent(content, "property", "og:image:width") !== "1200") {
      fail(`${relative} og:image:width should be 1200`);
    }
    if (metaContent(content, "property", "og:image:height") !== "630") {
      fail(`${relative} og:image:height should be 630`);
    }
    if (metaContent(content, "name", "twitter:card") !== "summary_large_image") {
      fail(`${relative} twitter:card should be summary_large_image`);
    }
    if (metaContent(content, "name", "twitter:image") !== socialImage) {
      fail(`${relative} has an invalid or missing twitter:image`);
    }
  }

  const isCoreGuide = guides.some((item) => route === `/guides/${item.slug}/`);
  const hasAdLoader = /pagead2\.googlesyndication\.com|__vavistAdsenseClient/.test(content);
  if (process.env.ADSENSE_MODE === "content" && isCoreGuide) {
    if (!hasAdLoader) fail(`${relative} should load AdSense in content mode`);
  } else if (hasAdLoader) {
    fail(`${relative} must not load AdSense`);
  }

  const links = [...content.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((match) => match[1]);

  for (const href of links) {
    if (!(await targetExists(href))) {
      fail(`${relative} has broken local link: ${href}`);
    }
  }

  return { route, title, description };
};

const checkSitemap = async () => {
  const sitemapPath = path.join(distDir, "sitemap.xml");
  if (!(await exists(sitemapPath))) fail("sitemap.xml is missing");
  const sitemap = await readFile(sitemapPath, "utf8");

  const entries = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/url>/g)].map(
    (match) => ({ loc: match[1], lastmod: match[2] || "" })
  );
  if (entries.length !== sitemapRoutes.length) {
    fail(`sitemap.xml should contain ${sitemapRoutes.length} URLs, found ${entries.length}`);
  }

  const seen = new Set();
  const latestGuideUpdate = guides.reduce(
    (latest, guide) => (guide.updated > latest ? guide.updated : latest),
    ""
  );
  for (const route of sitemapRoutes) {
    const loc = pathFor(route);
    const matches = entries.filter((entry) => entry.loc === loc);
    if (matches.length !== 1) fail(`sitemap.xml should contain ${loc} exactly once`);
    if (seen.has(loc)) fail(`sitemap.xml repeats ${loc}`);
    seen.add(loc);

    const guide = guides.find((item) => route === `/guides/${item.slug}/`);
    const expectedLastmod = guide?.updated || (["/", "/guides/"].includes(route) ? latestGuideUpdate : "");
    if (matches[0].lastmod !== expectedLastmod) {
      fail(
        `sitemap.xml lastmod for ${route} should be ${expectedLastmod || "omitted"}, found ${matches[0].lastmod || "omitted"}`
      );
    }
  }
};

const checkSocialImage = async () => {
  const imagePath = path.join(distDir, "assets", "social-card.png");
  if (!(await exists(imagePath))) fail("assets/social-card.png is missing");
  const image = await readFile(imagePath);
  const pngSignature = "89504e470d0a1a0a";
  if (image.subarray(0, 8).toString("hex") !== pngSignature) {
    fail("assets/social-card.png is not a valid PNG");
  }
  const width = image.readUInt32BE(16);
  const height = image.readUInt32BE(20);
  if (width !== 1200 || height !== 630) {
    fail(`assets/social-card.png should be 1200x630, found ${width}x${height}`);
  }
};

const checkAnalyticsInstrumentation = async () => {
  const mainApp = await readFile(path.join(distDir, "assets", "app.js"), "utf8");
  const mainAnalytics = await readFile(path.join(distDir, "assets", "analytics.js"), "utf8");
  const homeHtml = await readFile(path.join(distDir, "index.html"), "utf8");
  const guideHtml = await readFile(
    path.join(distDir, "guides", "three-js-gltf-loader-checklist", "index.html"),
    "utf8"
  );
  const mainInstrumentation = `${homeHtml}\n${guideHtml}\n${mainApp}\n${mainAnalytics}`;
  const toolAssets = await walk(path.join(distDir, "tools", "assets"));
  const toolJavaScript = (
    await Promise.all(
      toolAssets
        .filter((file) => file.endsWith(".js"))
        .map((file) => readFile(file, "utf8"))
    )
  ).join("\n");

  for (const token of ["vavist_analytics_off", "open_guide_source", "scroll_depth"]) {
    if (!mainInstrumentation.includes(token)) {
      fail(`Main-site analytics bundle is missing ${token}`);
    }
  }
  for (const token of [
    "vavist_analytics_off",
    "load_sample_model",
    "load_local_model",
    "calculate_fov",
    "customize_shader",
    "apply_lighting_preset",
    "copy_code"
  ]) {
    if (!toolJavaScript.includes(token)) {
      fail(`Tool analytics bundle is missing ${token}`);
    }
  }
};

const check = async () => {
  if (!(await exists(distDir))) fail("dist/ is missing. Run npm run build first.");

  const metadata = [];
  for (const route of indexableRoutes) {
    const filePath = fileForRoute(route);
    if (!(await exists(filePath))) fail(`Missing route ${route}`);
    metadata.push(await checkHtml(filePath, route, { toolPage: toolRoutes.includes(route) }));
  }

  for (const guide of retiredGuides) {
    const route = `/guides/${guide.slug}/`;
    const filePath = fileForRoute(route);
    if (!(await exists(filePath))) fail(`Missing retired route ${route}`);
    const expectedCanonical = guide.targetSlug
      ? pathFor(`/guides/${guide.targetSlug}/`)
      : pathFor(route);
    await checkHtml(filePath, route, {
      expectedRobots: "noindex,follow",
      expectedCanonical
    });
    const content = await readFile(filePath, "utf8");
    if (guide.targetSlug && guide.targetAnchor) {
      const expectedHref = `/guides/${guide.targetSlug}/#${guide.targetAnchor}`;
      if (!content.includes(`href="${expectedHref}"`)) {
        fail(`${route} must link to exact maintained section ${expectedHref}`);
      }
    }
  }

  const files = await walk(distDir);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  const titleOwners = new Map();
  const descriptionOwners = new Map();
  for (const item of metadata) {
    const titleKey = item.title.toLowerCase();
    const descriptionKey = item.description.toLowerCase();
    if (titleOwners.has(titleKey)) {
      fail(`Duplicate HTML title on ${item.route} and ${titleOwners.get(titleKey)}`);
    }
    if (descriptionOwners.has(descriptionKey)) {
      fail(`Duplicate HTML description on ${item.route} and ${descriptionOwners.get(descriptionKey)}`);
    }
    titleOwners.set(titleKey, item.route);
    descriptionOwners.set(descriptionKey, item.route);
  }

  const fallback404 = path.join(distDir, "404.html");
  if (!(await exists(fallback404))) fail("404.html is missing");
  await checkHtml(fallback404, "/404/");

  if (!(await exists(path.join(distDir, "robots.txt")))) fail("robots.txt is missing");
  await checkSocialImage();
  await checkSitemap();
  await checkAnalyticsInstrumentation();

  console.log(`Checked ${htmlFiles.length} HTML files successfully.`);
};

check().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
