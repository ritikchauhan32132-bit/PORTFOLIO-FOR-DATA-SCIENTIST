const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const contactHandler = require("./api/contact");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_BYTES = 12_000;
const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

try {
  process.loadEnvFile(path.join(ROOT, ".env.local"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function respond(res, statusCode, message) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify({ ok: false, message }));
}

async function handleContact(req, res) {
  const chunks = [];
  let bodySize = 0;
  let tooLarge = Number(req.headers["content-length"] || 0) > MAX_BODY_BYTES;

  for await (const chunk of req) {
    bodySize += chunk.length;
    if (bodySize > MAX_BODY_BYTES) tooLarge = true;
    if (!tooLarge) chunks.push(chunk);
  }

  if (tooLarge) {
    req.headers["content-length"] = String(MAX_BODY_BYTES + 1);
    req.body = {};
  } else {
    try {
      req.body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      req.body = null;
    }
  }

  await contactHandler(req, res);
}

async function handleStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method not allowed.");
    return;
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    res.writeHead(400);
    res.end("Invalid path.");
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const filePath = path.resolve(ROOT, relativePath);
  const pathFromRoot = path.relative(ROOT, filePath);
  if (pathFromRoot.startsWith("..") || path.isAbsolute(pathFromRoot)) {
    res.writeHead(403);
    res.end("Forbidden.");
    return;
  }

  const contentType = CONTENT_TYPES[path.extname(filePath).toLowerCase()];
  if (!contentType || pathFromRoot.split(path.sep)[0] === "api") {
    res.writeHead(404);
    res.end("Not found.");
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff"
    });
    res.end(req.method === "HEAD" ? undefined : content);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      res.writeHead(404);
      res.end("Not found.");
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (pathname === "/api/contact") {
      await handleContact(req, res);
      return;
    }
    if (pathname.startsWith("/api/")) {
      respond(res, 404, "API route not found.");
      return;
    }
    await handleStatic(req, res, pathname);
  } catch (error) {
    console.error("Local development server request failed.", error);
    if (!res.headersSent) {
      respond(res, 500, "The local server could not complete this request.");
    } else {
      res.destroy(error);
    }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Portfolio available at http://localhost:${PORT}`);
});
