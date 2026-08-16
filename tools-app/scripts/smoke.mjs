import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const port = 4187;
const baseUrl = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["../scripts/serve.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
  shell: false
});

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

try {
  await waitForServer();
  const browser = await chromium.launch(getLaunchOptions());
  await checkStaticHtml(browser);
  await checkInteractiveTools(browser);
  await browser.close();
  console.log("Tool smoke checks passed with JavaScript disabled and enabled.");
} finally {
  server.kill();
}

async function checkStaticHtml(browser) {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/tools/gltf-viewer/`);
  await expectText(page, "#metric-meshes", "1");
  await expectText(page, "#metric-vertices", "24");
  await expectText(page, "#metric-triangles", "12");
  await expectText(page, "#metric-size", "2.00 x 2.00 x 2.00");
  await expectText(page, "#viewer-status", "Built-in sample ready. No local file selected.");

  await page.goto(`${baseUrl}/tools/camera-fov/`);
  await expectText(page, "#vertical-fov", "24.81 deg");
  await expectText(page, "#horizontal-fov", "42.71 deg");
  await expectText(page, "#visible-width", "3.91");
  await expectMatch(page, "#fov-code", /camera\.fov = 24\.81/);

  await page.goto(`${baseUrl}/tools/shader-starter/`);
  await expectMatch(page, "#shader-code", /new THREE\.ShaderMaterial/);
  await page.goto(`${baseUrl}/tools/lighting-presets/`);
  await expectMatch(page, "#lighting-code", /new THREE\.DirectionalLight/);
  await context.close();
}

async function checkInteractiveTools(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  for (const route of [
    "/tools/gltf-viewer/",
    "/tools/camera-fov/",
    "/tools/shader-starter/",
    "/tools/lighting-presets/",
    "/tools/examples/"
  ]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
    await page.locator("h1").waitFor({ state: "visible" });
    await assertNoHorizontalOverflow(page, route);
  }

  await page.goto(`${baseUrl}/tools/gltf-viewer/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() =>
    /Built-in sample ready:/.test(document.querySelector("#viewer-status")?.textContent || "")
  );
  await expectText(page, "#metric-meshes", "1");
  await expectText(page, "#metric-vertices", "24");
  await page.locator("#model-file").setInputFiles({
    name: "unsupported.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a model")
  });
  await expectText(page, "#viewer-status", "Choose a .glb or .gltf file.");
  await expectAnalyticsEvent(page, "tool_error");
  await page.locator("#load-sample").click();
  await page.waitForFunction(() => /Built-in sample ready/.test(document.querySelector("#viewer-status")?.textContent || ""));
  await expectAnalyticsEvent(page, "load_sample_model");

  await page.goto(`${baseUrl}/tools/camera-fov/`, { waitUntil: "networkidle" });
  await page.locator("#camera-distance").fill("10");
  await expectText(page, "#vertical-fov", "12.55 deg");
  await expectAnalyticsEvent(page, "calculate_fov");
  await page.locator("[data-copy-target='#fov-code']").click();
  await expectText(page, "[data-copy-target='#fov-code']", "Copied");
  await expectAnalyticsEvent(page, "copy_code");

  await page.goto(`${baseUrl}/tools/shader-starter/`, { waitUntil: "networkidle" });
  await page.locator("#shader-pattern").selectOption("radial");
  await expectAnalyticsEvent(page, "customize_shader");
  await page.locator("[data-copy-target='#shader-code']").click();
  await expectAnalyticsEvent(page, "copy_code");

  await page.goto(`${baseUrl}/tools/lighting-presets/`, { waitUntil: "networkidle" });
  await page.locator("#lighting-preset").selectOption("dusk");
  await expectAnalyticsEvent(page, "apply_lighting_preset");
  await page.locator("[data-copy-target='#lighting-code']").click();
  await expectAnalyticsEvent(page, "copy_code");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/tools/gltf-viewer/",
    "/tools/camera-fov/",
    "/tools/shader-starter/",
    "/tools/lighting-presets/",
    "/tools/examples/"
  ]) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await assertNoHorizontalOverflow(page, `mobile ${route}`);
  }

  if (consoleErrors.length) {
    throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
  }
  await context.close();
}

async function waitForServer() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Server did not start:\n${output}`);
}

async function expectText(page, selector, expected) {
  const text = (await page.locator(selector).innerText()).trim();
  if (text !== expected) throw new Error(`${selector}: expected "${expected}", found "${text}"`);
}

async function expectMatch(page, selector, pattern) {
  const text = await page.locator(selector).innerText();
  if (!pattern.test(text)) throw new Error(`${selector}: content did not match ${pattern}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  if (overflow > 1) throw new Error(`${label}: horizontal overflow ${overflow}px`);
}

async function expectAnalyticsEvent(page, eventName) {
  await page.waitForFunction(
    (expected) =>
      Array.from(window.dataLayer || []).some((entry) => {
        const values = Array.from(entry || []);
        return values[0] === "event" && values[1] === expected;
      }),
    eventName,
    { timeout: 3000 }
  );
}

function getLaunchOptions() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROME_EXECUTABLE,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    `${process.env.LOCALAPPDATA || ""}\\Google\\Chrome\\Application\\chrome.exe`,
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  const executablePath = candidates.find((candidate) => existsSync(candidate));
  return executablePath ? { executablePath } : {};
}
