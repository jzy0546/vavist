import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
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
  response.writeHead(200, { "content-type": types[ext] || "application/octet-stream" });
  response.end(body);
});

server.listen(port, () => {
  console.log(`Serving dist/ at http://localhost:${port}`);
});
