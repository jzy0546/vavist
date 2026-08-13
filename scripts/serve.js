import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { brotliCompress as brotliCompressCallback } from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 4173);
const brotliCompress = promisify(brotliCompressCallback);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

const safePath = (urlPath) => {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const clean = decoded === "/" ? "/index.html" : decoded;
  const joined = path.join(distDir, clean);
  const normalized = path.normalize(joined);
  if (!normalized.startsWith(distDir)) return null;
  return normalized;
};

const resolveFile = async (urlPath) => {
  const first = safePath(urlPath);
  if (!first) return null;

  try {
    const info = await stat(first);
    if (info.isDirectory()) return path.join(first, "index.html");
    return first;
  } catch {
    if (!path.extname(first)) {
      const indexPath = path.join(first, "index.html");
      try {
        await stat(indexPath);
        return indexPath;
      } catch {
        return null;
      }
    }
    return null;
  }
};

const server = createServer(async (request, response) => {
  const filePath = await resolveFile(request.url || "/");
  if (!filePath) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  const body = await readFile(filePath);
  const headers = {
    "content-type": types[ext] || "application/octet-stream",
    "cache-control": (request.url || "").startsWith("/assets/")
      ? "public, max-age=31536000, immutable"
      : "public, max-age=0, must-revalidate"
  };
  if (/\.(?:html|css|js|svg|xml|txt)$/.test(ext) && request.headers["accept-encoding"]?.includes("br")) {
    headers["content-encoding"] = "br";
    headers.vary = "Accept-Encoding";
    response.writeHead(200, headers);
    response.end(await brotliCompress(body));
    return;
  }
  response.writeHead(200, headers);
  response.end(body);
});

server.listen(port, () => {
  console.log(`Serving dist/ at http://localhost:${port}`);
});
