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

const PROGRESS_FILE = path.join(ROOT, "progress.json");

function readBody(req){
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > 1e7) reject(new Error("body too large")); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  let reqPath = url.parse(req.url).pathname;

  // ---------- /api/progress ----------
  if (reqPath === "/api/progress") {
    if (req.method === "GET") {
      fs.readFile(PROGRESS_FILE, "utf8", (err, data) => {
        if (err) { res.writeHead(404); return res.end("progress.json missing"); }
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
        res.end(data);
      });
      return;
    }
    if (req.method === "PUT") {
      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body); // validate
        if (!parsed || !Array.isArray(parsed.areas)) throw new Error("missing areas[]");
        parsed.updated = new Date().toISOString().slice(0,10);
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(parsed, null, 2) + "\n", "utf8");
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, updated: parsed.updated }));
        const ts = new Date().toISOString().slice(11,19);
        console.log(`[${ts}] 200 PUT /api/progress (${parsed.areas.length} areas)`);
      } catch (e) {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Bad request: " + e.message);
      }
      return;
    }
    res.writeHead(405); return res.end("Method not allowed");
  }

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
