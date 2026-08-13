import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse, { defaultConfig, desktopConfig } from "lighthouse";
import { chromium } from "playwright-core";
import { site } from "../src/config.js";
import { guides } from "../src/guides.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const categories = ["performance", "accessibility", "best-practices", "seo"];
const defaultBrowserRoutes = [
  "/",
  "/guides/",
  ...guides.map((guide) => `/guides/${guide.slug}/`)
];
const defaultLighthouseRoutes = ["/", `/guides/${guides[0].slug}/`];
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 }
];

const parseList = (value, fallback) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((route) => (route.startsWith("/") ? route : `/${route}`))
    : fallback;

const options = process.argv.slice(2).reduce(
  (result, argument) => {
    const [key, value] = argument.split("=", 2);
    if (key === "--base-url" && value) result.baseUrl = value.replace(/\/$/, "");
    if (key === "--routes" && value) result.routes = parseList(value, defaultBrowserRoutes);
    if (key === "--lighthouse-routes" && value) {
      result.lighthouseRoutes = parseList(value, defaultLighthouseRoutes);
    }
    if (key === "--runs" && value) result.runs = Math.max(1, Number(value));
    if (key === "--threshold" && value) result.threshold = Number(value);
    if (key === "--viewports" && value) {
      result.viewportNames = value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (key === "--visual-only") result.visualOnly = true;
    return result;
  },
  {
    baseUrl: "",
    routes: defaultBrowserRoutes,
    lighthouseRoutes: defaultLighthouseRoutes,
    runs: 3,
    threshold: 100,
    viewportNames: viewports.map((viewport) => viewport.name),
    visualOnly: false
  }
);

const fail = (message) => {
  throw new Error(message);
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });

const waitForUrl = async (url, attempts = 80) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  fail(`Timed out waiting for ${url}`);
};

const startLocalServer = async () => {
  const port = await freePort();
  const child = spawn(process.execPath, [path.join(rootDir, "scripts", "serve.js")], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  child.once("exit", (code) => {
    if (code && code !== 0) process.stderr.write(stderr);
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForUrl(`${baseUrl}/`);
  return { baseUrl, child };
};

const routeName = (route) => (route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replaceAll("/", "--"));

const pngDimensions = async (file) => {
  const image = await readFile(file);
  if (image.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    fail(`${file} is not a PNG`);
  }
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
};

const expectedCanonical = (route) => `${site.url}${route === "/" ? "/" : route}`;

const runBrowserChecks = async ({ baseUrl, evidenceDir }) => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const results = [];
  try {
    for (const viewport of viewports.filter((item) => options.viewportNames.includes(item.name))) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        reducedMotion: "reduce"
      });
      for (const route of options.routes) {
        const page = await context.newPage();
        const errors = [];
        const warnings = [];
        page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
        page.on("console", (message) => {
          if (message.type() !== "error") return;
          const sourceUrl = message.location().url;
          try {
            const isLocal = !sourceUrl || new URL(sourceUrl).origin === new URL(baseUrl).origin;
            const collection = isLocal ? errors : warnings;
            collection.push(`console: ${message.text()}${sourceUrl ? ` (${sourceUrl})` : ""}`);
          } catch {
            errors.push(`console: ${message.text()}`);
          }
        });
        page.on("requestfailed", (request) => {
          try {
            if (new URL(request.url()).origin === new URL(baseUrl).origin) {
              errors.push(`request failed: ${request.url()} (${request.failure()?.errorText || "unknown"})`);
            }
          } catch {
            errors.push(`request failed: ${request.url()}`);
          }
        });

        const response = await page.goto(`${baseUrl}${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 30000
        });
        if (!response?.ok()) fail(`${route} returned HTTP ${response?.status() || "unknown"}`);
        await page.waitForTimeout(120);

        const state = await page.evaluate(() => {
          const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
          const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map(
            (script) => script.textContent || ""
          );
          return {
            h1Count: document.querySelectorAll("h1").length,
            canonical,
            jsonLd,
            scrollWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth
          };
        });
        if (state.h1Count !== 1) fail(`${route} at ${viewport.width}px has ${state.h1Count} h1 elements`);
        if (state.canonical !== expectedCanonical(route)) {
          fail(`${route} canonical should be ${expectedCanonical(route)}, found ${state.canonical}`);
        }
        if (!state.jsonLd.length) fail(`${route} is missing JSON-LD`);
        for (const block of state.jsonLd) JSON.parse(block);
        if (state.scrollWidth > state.viewportWidth + 1) {
          fail(`${route} overflows horizontally at ${viewport.width}px (${state.scrollWidth}px wide)`);
        }

        if (viewport.width === 375 && route === "/") {
          const menuButton = page.locator("[data-menu-button]");
          await menuButton.click();
          if ((await menuButton.getAttribute("aria-expanded")) !== "true") {
            fail(`${route} mobile navigation did not open`);
          }
          if ((await page.locator("[data-menu]").getAttribute("data-open")) === null) {
            fail(`${route} mobile navigation is missing its open state`);
          }
          await menuButton.click();
          await page.waitForSelector('[data-scene-ready="true"]', { timeout: 15000 });
          const enhancements = await page.evaluate(() => ({
            analytics: Boolean(document.querySelector('script[src*="googletagmanager.com/gtag"]')),
            adsense: Boolean(document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js"]')),
            canvasWidth: document.querySelector("#lab-canvas")?.getBoundingClientRect().width || 0
          }));
          if (!enhancements.analytics || enhancements.adsense || enhancements.canvasWidth <= 0) {
            fail(`${route} deferred enhancements did not activate`);
          }
        }

        if (errors.length) fail(`${route} at ${viewport.width}px browser errors:\n${errors.join("\n")}`);

        const screenshot = path.join(evidenceDir, `${routeName(route)}-${viewport.name}.png`);
        await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
        const dimensions = await pngDimensions(screenshot);
        if (dimensions.width !== viewport.width || dimensions.height < viewport.height) {
          fail(
            `${path.basename(screenshot)} dimensions should be ${viewport.width}x${viewport.height} or taller, found ${dimensions.width}x${dimensions.height}`
          );
        }
        results.push({ route, viewport: viewport.width, screenshot, dimensions, warnings });
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return results;
};

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

const auditFailures = (lhr) =>
  Object.values(lhr.audits)
    .filter(
      (audit) =>
        typeof audit.score === "number" &&
        audit.score < 1 &&
        !["notApplicable", "manual", "informative"].includes(audit.scoreDisplayMode)
    )
    .sort((left, right) => left.score - right.score)
    .slice(0, 12)
    .map((audit) => `${audit.id}: ${Math.round(audit.score * 100)} (${audit.title})`);

const launchAuditedChrome = async () => {
  const port = await freePort();
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [`--remote-debugging-port=${port}`]
  });
  await waitForUrl(`http://127.0.0.1:${port}/json/version`);
  return { browser, port };
};

const runLighthouseChecks = async ({ baseUrl, evidenceDir }) => {
  const { browser, port } = await launchAuditedChrome();
  const results = [];
  try {
    for (const route of options.lighthouseRoutes) {
      for (const formFactor of ["mobile", "desktop"]) {
        const runs = [];
        for (let run = 1; run <= options.runs; run += 1) {
          const warmup = await browser.newPage({ viewport: { width: 1280, height: 900 } });
          await warmup.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
          await warmup.close();

          const report = await lighthouse(
            `${baseUrl}${route}`,
            {
              port,
              output: "json",
              logLevel: "error",
              onlyCategories: categories,
              disableStorageReset: true
            },
            formFactor === "desktop" ? desktopConfig : defaultConfig
          );
          if (!report?.lhr) fail(`Lighthouse returned no report for ${route} (${formFactor})`);
          const scores = Object.fromEntries(
            categories.map((category) => [category, Math.round((report.lhr.categories[category]?.score || 0) * 100)])
          );
          const reportPath = path.join(
            evidenceDir,
            `lighthouse-${routeName(route)}-${formFactor}-${run}.json`
          );
          await writeFile(reportPath, JSON.stringify(report.lhr, null, 2), "utf8");
          runs.push({ run, scores, failures: auditFailures(report.lhr), reportPath });
        }

        const scores = Object.fromEntries(
          categories.map((category) => [category, median(runs.map((run) => run.scores[category]))])
        );
        const belowThreshold = categories.filter((category) => scores[category] < options.threshold);
        results.push({ route, formFactor, scores, runs });
        if (belowThreshold.length) {
          const details = runs
            .find((run) => run.scores[belowThreshold[0]] === scores[belowThreshold[0]])
            ?.failures.join("\n");
          fail(
            `${route} ${formFactor} Lighthouse median missed ${options.threshold}: ${JSON.stringify(scores)}${details ? `\n${details}` : ""}`
          );
        }
      }
    }
  } finally {
    await browser.close();
  }
  return results;
};

const run = async () => {
  const evidenceDir = path.join(os.tmpdir(), "vavist-qa", new Date().toISOString().replace(/[:.]/g, "-"));
  await mkdir(evidenceDir, { recursive: true });
  let server;
  try {
    const local = options.baseUrl ? { baseUrl: options.baseUrl, child: null } : await startLocalServer();
    server = local.child;
    const browserChecks = await runBrowserChecks({ baseUrl: local.baseUrl, evidenceDir });
    const lighthouseChecks = options.visualOnly
      ? []
      : await runLighthouseChecks({ baseUrl: local.baseUrl, evidenceDir });
    const summary = {
      baseUrl: local.baseUrl,
      createdAt: new Date().toISOString(),
      browserChecks,
      lighthouseChecks
    };
    await writeFile(path.join(evidenceDir, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
    console.log(`Browser QA passed ${browserChecks.length} route/viewport checks.`);
    if (lighthouseChecks.length) {
      for (const result of lighthouseChecks) {
        console.log(
          `Lighthouse ${result.route} ${result.formFactor}: ${categories
            .map((category) => `${category} ${result.scores[category]}`)
            .join(", ")}`
        );
      }
    }
    console.log(`QA evidence: ${evidenceDir}`);
  } finally {
    if (server && !server.killed) server.kill();
  }
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
