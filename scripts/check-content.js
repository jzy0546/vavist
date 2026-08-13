import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guides, retiredGuides } from "../src/guides.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);
const primaryHosts = new Set([
  "threejs.org",
  "developer.mozilla.org",
  "www.khronos.org",
  "khronos.org",
  "www.w3.org",
  "w3.org",
  "web.dev",
  "developers.google.com",
  "support.google.com"
]);

const fail = (message) => {
  throw new Error(message);
};

const normalized = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const assertUnique = (field) => {
  const seen = new Map();
  for (const guide of guides) {
    const value = normalized(guide[field]);
    if (!value) fail(`${guide.slug || "Guide"} is missing ${field}`);
    if (seen.has(value)) {
      fail(`Duplicate guide ${field}: ${guide.slug} and ${seen.get(value)}`);
    }
    seen.set(value, guide.slug);
  }
};

const shingleSet = (value, size = 5) => {
  const words = normalized(value).split(" ").filter(Boolean);
  const shingles = new Set();
  for (let index = 0; index <= words.length - size; index += 1) {
    shingles.add(words.slice(index, index + size).join(" "));
  }
  return shingles;
};

const similarity = (left, right) => {
  const leftSet = shingleSet(left);
  const rightSet = shingleSet(right);
  if (!leftSet.size || !rightSet.size) return 0;
  const intersection = [...leftSet].filter((item) => rightSet.has(item)).length;
  return intersection / (leftSet.size + rightSet.size - intersection);
};

const validateGuides = () => {
  if (guides.length !== 10) fail(`Expected exactly 10 core guides, found ${guides.length}`);
  if (retiredGuides.length !== 14) {
    fail(`Expected exactly 14 retired guides, found ${retiredGuides.length}`);
  }
  assertUnique("slug");
  assertUnique("title");
  assertUnique("description");

  const paragraphs = new Map();
  const documents = [];

  for (const guide of guides) {
    if (guide.status !== "core") fail(`${guide.slug} must have status=core`);
    if (guide.authorId !== "jzy") fail(`${guide.slug} must use authorId=jzy`);
    if (!guide.cluster?.trim()) fail(`${guide.slug} is missing cluster`);
    if (guide.lastTested !== guide.updated) {
      fail(`${guide.slug} lastTested must match the verified update date`);
    }
    if (guide.testedWith?.three !== "0.185.0") {
      fail(`${guide.slug} must record Three.js 0.185.0`);
    }
    if (!guide.testedWith?.browsers?.some((item) => /Chrome 151/.test(item))) {
      fail(`${guide.slug} is missing the tested Chrome version`);
    }
    if (!guide.testedWith?.browsers?.some((item) => /Edge 151/.test(item))) {
      fail(`${guide.slug} is missing the tested Edge version`);
    }
    if (guide.testedWith?.safari !== "Not tested" || guide.testedWith?.ios !== "Not tested") {
      fail(`${guide.slug} must state that Safari and iOS were not tested`);
    }
    if (!Array.isArray(guide.changelog) || !guide.changelog.length) {
      fail(`${guide.slug} needs a changelog`);
    }
    if (!Array.isArray(guide.blocks) || guide.blocks.length < 3) {
      fail(`${guide.slug} needs at least three evidence blocks`);
    }
    const blockTypes = new Set(guide.blocks.map((block) => block.type));
    if (blockTypes.size < 3) {
      fail(`${guide.slug} needs at least three distinct evidence block types`);
    }
    for (const requiredType of ["demo", "code-comparison", "metric-table", "steps"]) {
      if (!blockTypes.has(requiredType)) fail(`${guide.slug} is missing ${requiredType} evidence`);
    }
    const blockHeadings = new Set();
    for (const block of guide.blocks) {
      const heading = normalized(block.heading);
      if (!heading) fail(`${guide.slug} has an evidence block without a heading`);
      if (blockHeadings.has(heading)) fail(`${guide.slug} repeats evidence heading: ${block.heading}`);
      blockHeadings.add(heading);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug)) {
      fail(`${guide.slug} has an invalid slug`);
    }
    if (guide.title.length < 30 || guide.title.length > 70) {
      fail(`${guide.slug} title should be 30-70 characters, found ${guide.title.length}`);
    }
    if (guide.description.length < 80 || guide.description.length > 170) {
      fail(`${guide.slug} description should be 80-170 characters, found ${guide.description.length}`);
    }
    for (const field of ["published", "updated"]) {
      const value = guide[field];
      if (!isoDate.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
        fail(`${guide.slug} has invalid ${field} date: ${value}`);
      }
      if (value > today) fail(`${guide.slug} has future ${field} date: ${value}`);
    }
    if (guide.published > guide.updated) {
      fail(`${guide.slug} was updated before it was published`);
    }
    if (!Array.isArray(guide.sources) || !guide.sources.length) {
      fail(`${guide.slug} needs at least one source`);
    }

    let hasPrimarySource = false;
    const sourceUrls = new Set();
    for (const source of guide.sources) {
      let parsed;
      try {
        parsed = new URL(source.url);
      } catch {
        fail(`${guide.slug} has invalid source URL: ${source.url}`);
      }
      if (parsed.protocol !== "https:") {
        fail(`${guide.slug} source must use HTTPS: ${source.url}`);
      }
      if (sourceUrls.has(parsed.href)) {
        fail(`${guide.slug} repeats source URL: ${source.url}`);
      }
      sourceUrls.add(parsed.href);
      hasPrimarySource ||= primaryHosts.has(parsed.hostname);
    }
    if (!hasPrimarySource) {
      fail(`${guide.slug} needs at least one official or primary source`);
    }

    if (guide.faqs !== undefined) {
      if (!Array.isArray(guide.faqs) || !guide.faqs.length) {
        fail(`${guide.slug} faqs must be omitted or contain guide-specific questions`);
      }
      for (const faq of guide.faqs) {
        if (!faq.q?.trim() || !faq.a?.trim()) fail(`${guide.slug} has an incomplete FAQ item`);
      }
    }

    const bodyParagraphs = guide.sections.flatMap((section) => section.paragraphs || []);
    for (const paragraph of bodyParagraphs) {
      const key = normalized(paragraph);
      if (key.length < 120) continue;
      if (paragraphs.has(key)) {
        fail(`Duplicate guide paragraph: ${guide.slug} and ${paragraphs.get(key)}`);
      }
      paragraphs.set(key, guide.slug);
    }
    documents.push({ slug: guide.slug, text: bodyParagraphs.join(" ") });
  }

  for (let left = 0; left < documents.length; left += 1) {
    for (let right = left + 1; right < documents.length; right += 1) {
      const score = similarity(documents[left].text, documents[right].text);
      if (score >= 0.72) {
        fail(
          `Guide content is too similar (${Math.round(score * 100)}%): ${documents[left].slug} and ${documents[right].slug}`
        );
      }
    }
  }

  const coreSlugs = new Set(guides.map((guide) => guide.slug));
  const retiredSlugs = new Set();
  for (const guide of retiredGuides) {
    if (guide.status !== "retired") fail(`${guide.slug} must have status=retired`);
    if (coreSlugs.has(guide.slug)) fail(`${guide.slug} cannot be both core and retired`);
    if (retiredSlugs.has(guide.slug)) fail(`Duplicate retired guide slug: ${guide.slug}`);
    retiredSlugs.add(guide.slug);
    if (!guide.reason?.trim()) fail(`${guide.slug} needs a retirement reason`);
    if (guide.targetSlug && !coreSlugs.has(guide.targetSlug)) {
      fail(`${guide.slug} points to non-core target ${guide.targetSlug}`);
    }
  }
};

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : fullPath;
    })
  );
  return nested.flat();
};

const validateSensitiveInformation = async () => {
  const roots = [path.join(rootDir, "src"), path.join(rootDir, "scripts")];
  const files = (await Promise.all(roots.map(walk)))
    .flat()
    .filter((file) => /\.(?:js|json|css|svg|ya?ml)$/i.test(file));
  files.push(path.join(rootDir, "package.json"));

  const patterns = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bsk-[A-Za-z0-9]{20,}\b/
  ];

  for (const file of files) {
    const content = await readFile(file, "utf8");
    if (patterns.some((pattern) => pattern.test(content))) {
      fail(`Potential credential or private key found in ${path.relative(rootDir, file)}`);
    }
  }
};

const check = async () => {
  validateGuides();
  await validateSensitiveInformation();
  console.log(`Checked ${guides.length} guides for metadata, dates, sources, duplication, and secrets.`);
};

check().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
