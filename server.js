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
  let decoded;
  try { decoded = decodeURIComponent(reqPath.split("?")[0]); } catch { return null; }
  if (decoded.includes("\0")) return null;
  // Strip leading slashes/backslashes so resolve doesn't treat it as absolute.
  const clean = decoded.replace(/^[\\/]+/, "");
  const resolved = path.resolve(root, clean);
  const rel = path.relative(root, resolved);
  // rel must be empty (root itself) or a relative path that does not climb out.
  if (rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel))) return resolved;
  return null;
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

function validateProgress(p){
  const errs = [];
  if (!p || typeof p !== "object") return ["payload must be an object"];
  if (!Array.isArray(p.states) || p.states.length === 0) errs.push("states[] required");
  if (!Array.isArray(p.areas))  errs.push("areas[] required");
  if (errs.length) return errs;
  const stateIds = new Set();
  for (const [i, s] of p.states.entries()) {
    if (!s || typeof s.id !== "string" || typeof s.label !== "string" || typeof s.color !== "string")
      errs.push(`states[${i}] must have id/label/color strings`);
    else if (stateIds.has(s.id)) errs.push(`duplicate state id "${s.id}"`);
    else stateIds.add(s.id);
  }
  const seenIds = new Set();
  const allowedFields = new Set(["id","name","category","status","progress","owner","notes","docs"]);
  for (const [i, a] of p.areas.entries()) {
    if (!a || typeof a !== "object") { errs.push(`areas[${i}] must be object`); continue; }
    for (const k of Object.keys(a)) if (!allowedFields.has(k)) errs.push(`areas[${i}] has unknown field "${k}"`);
    if (typeof a.id !== "string" || !a.id) errs.push(`areas[${i}].id required`);
    else if (seenIds.has(a.id)) errs.push(`duplicate area id "${a.id}"`);
    else seenIds.add(a.id);
    if (typeof a.name !== "string") errs.push(`areas[${i}].name must be string`);
    if (typeof a.category !== "string") errs.push(`areas[${i}].category must be string`);
    if (typeof a.status !== "string" || !stateIds.has(a.status)) errs.push(`areas[${i}].status "${a.status}" not in states[]`);
    if (typeof a.progress !== "number" || !Number.isFinite(a.progress)) errs.push(`areas[${i}].progress must be number`);
    if (a.owner != null && typeof a.owner !== "string") errs.push(`areas[${i}].owner must be string`);
    if (a.notes != null && typeof a.notes !== "string") errs.push(`areas[${i}].notes must be string`);
    if (a.docs != null && (!Array.isArray(a.docs) || a.docs.some(d => typeof d !== "string"))) errs.push(`areas[${i}].docs must be string[]`);
    // clamp progress in place
    if (typeof a.progress === "number") a.progress = Math.max(0, Math.min(100, Math.round(a.progress)));
  }
  return errs;
}

function atomicWriteJson(file, obj){
  const tmp = file + ".tmp." + process.pid + "." + Date.now();
  const data = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(tmp, data, { encoding: "utf8", mode: 0o644 });
  // Backup current file (best-effort) before swap.
  try { if (fs.existsSync(file)) fs.copyFileSync(file, file + ".bak"); } catch {}
  fs.renameSync(tmp, file);
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
        let parsed;
        try { parsed = JSON.parse(body); } catch { throw new Error("invalid JSON"); }
        const errs = validateProgress(parsed);
        if (errs.length) {
          res.writeHead(422, { "Content-Type": "application/json; charset=utf-8" });
          return res.end(JSON.stringify({ ok: false, errors: errs }));
        }
        parsed.schema = parsed.schema || 1;
        parsed.updated = new Date().toISOString().slice(0,10);
        atomicWriteJson(PROGRESS_FILE, parsed);
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: true, updated: parsed.updated, areas: parsed.areas.length }));
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
