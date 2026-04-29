#!/usr/bin/env node
// Zero-dependency static server for the Telecheck Command Center.
// Run: node server.js   (default port 8000, override with PORT env var)

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md":   "text/markdown; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
  ".txt":  "text/plain; charset=utf-8",
};

function safeJoin(root, reqPath){
  const decoded = decodeURIComponent(reqPath.split("?")[0]);
  const resolved = path.normalize(path.join(root, decoded));
  if (!resolved.startsWith(root)) return null; // path traversal guard
  return resolved;
}

const server = http.createServer((req, res) => {
  let reqPath = url.parse(req.url).pathname;
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = safeJoin(ROOT, reqPath);
  if (!filePath) { res.writeHead(403); return res.end("Forbidden"); }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(`404 Not Found: ${reqPath}`);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(filePath).pipe(res);
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] 200 ${req.method} ${reqPath}`);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Telecheck Command Center → http://${HOST}:${PORT}/`);
  console.log(`Serving: ${ROOT}`);
  console.log(`Stop with Ctrl+C`);
});
