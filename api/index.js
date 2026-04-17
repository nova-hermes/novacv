import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, normalize, resolve } from "node:path";
import { Readable } from "node:stream";

const serverModule = await import("../dist/server/server.js");
const serverEntry = serverModule.default;

const clientDir = resolve(process.cwd(), "dist/client");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
};

function getContentType(filePath) {
  const extension = extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || "application/octet-stream";
}

function resolveStaticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^[/\\]+/, "");
  const absolutePath = resolve(clientDir, normalized);
  if (!absolutePath.startsWith(clientDir)) return null;
  if (!existsSync(absolutePath)) return null;
  const stats = statSync(absolutePath);
  if (!stats.isFile()) return null;
  return absolutePath;
}

export default async function handler(req, res) {
  try {
    const protocol = (req.headers["x-forwarded-proto"] || "https")
      .toString()
      .split(",")[0]
      .trim();
    const host =
      req.headers.host || req.headers["x-forwarded-host"] || "localhost";
    const url = new URL(req.url || "/", `${protocol}://${host}`);

    // Try static files first
    if (url.pathname && !url.pathname.endsWith("/")) {
      const filePath = resolveStaticFile(url.pathname);
      if (filePath) {
        res.statusCode = 200;
        res.setHeader("Content-Type", getContentType(filePath));
        if (url.pathname.startsWith("/assets/")) {
          res.setHeader(
            "Cache-Control",
            "public, max-age=31536000, immutable"
          );
        } else {
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
        createReadStream(filePath).pipe(res);
        return;
      }
    }

    // SSR through TanStack Start
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === "string") {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      }
    }

    const init = {
      method: req.method || "GET",
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      init.body = Readable.toWeb(req);
      init.duplex = "half";
    }

    const request = new Request(url, init);
    const response = await serverEntry.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        const existing = res.getHeader("set-cookie");
        if (!existing) {
          res.setHeader("set-cookie", value);
        } else if (Array.isArray(existing)) {
          res.setHeader("set-cookie", [...existing, value]);
        } else {
          res.setHeader("set-cookie", [String(existing), value]);
        }
      } else {
        res.setHeader(key, value);
      }
    });

    if (req.method === "HEAD" || !response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error("Server error:", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
}
