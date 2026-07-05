import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tools } from "../src/tools.js";
import { pages } from "../src/pages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const requiredRoutes = [
  "/",
  ...tools.map((tool) => `/tools/${tool.slug}/`),
  ...pages.map((page) => `/${page.slug}/`)
];

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

  if (clean === "/") return exists(path.join(distDir, "index.html"));
  return exists(path.join(distDir, clean.replace(/^\/|\/$/g, ""), "index.html"));
};

const checkHtml = async (filePath) => {
  const content = await readFile(filePath, "utf8");
  const relative = path.relative(distDir, filePath);

  if (!/<title>[^<]+<\/title>/.test(content)) fail(`${relative} is missing title`);
  if (!/<meta name="description" content="[^"]+">/.test(content)) {
    fail(`${relative} is missing meta description`);
  }
  if (!/<h1>[^<]+<\/h1>/.test(content)) fail(`${relative} is missing h1`);
  if (!/<link rel="canonical" href="[^"]+">/.test(content)) {
    fail(`${relative} is missing canonical`);
  }
  if (/noindex/i.test(content)) fail(`${relative} contains noindex`);

  const jsonBlocks = [...content.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (jsonBlocks.length === 0) fail(`${relative} is missing JSON-LD`);
  for (const block of jsonBlocks) {
    JSON.parse(block[1]);
  }

  const links = [
    ...content.matchAll(/\s(?:href|src)="([^"]+)"/g)
  ].map((match) => match[1]);

  for (const href of links) {
    if (!(await targetExists(href))) {
      fail(`${relative} has broken local link: ${href}`);
    }
  }
};

const checkSitemap = async () => {
  const sitemapPath = path.join(distDir, "sitemap.xml");
  if (!(await exists(sitemapPath))) fail("sitemap.xml is missing");
  const sitemap = await readFile(sitemapPath, "utf8");

  for (const route of requiredRoutes) {
    if (!sitemap.includes(route === "/" ? "<loc>" : route)) {
      fail(`sitemap.xml is missing route ${route}`);
    }
  }
};

const check = async () => {
  if (!(await exists(distDir))) fail("dist/ is missing. Run npm run build first.");

  for (const route of requiredRoutes) {
    const filePath = fileForRoute(route);
    if (!(await exists(filePath))) fail(`Missing route ${route}`);
  }

  const files = await walk(distDir);
  const htmlFiles = files.filter((file) => file.endsWith(".html"));
  for (const file of htmlFiles) {
    await checkHtml(file);
  }

  if (!(await exists(path.join(distDir, "robots.txt")))) fail("robots.txt is missing");
  await checkSitemap();

  console.log(`Checked ${htmlFiles.length} HTML files successfully.`);
};

check().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
