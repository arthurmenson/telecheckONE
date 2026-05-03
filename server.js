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
  // Optional lifecycle block
  if (p.lifecycle != null) {
    if (typeof p.lifecycle !== "object") errs.push("lifecycle must be object");
    else {
      if (!Array.isArray(p.lifecycle.stages) || p.lifecycle.stages.length === 0)
        errs.push("lifecycle.stages[] required");
      else {
        const stageIds = new Set();
        const allowedStage = new Set(["id","label","description","exit"]);
        for (const [i,s] of p.lifecycle.stages.entries()){
          if (!s || typeof s !== "object") { errs.push(`lifecycle.stages[${i}] must be object`); continue; }
          for (const k of Object.keys(s)) if (!allowedStage.has(k)) errs.push(`lifecycle.stages[${i}] unknown field "${k}"`);
          if (typeof s.id !== "string" || !s.id) errs.push(`lifecycle.stages[${i}].id required`);
          else if (stageIds.has(s.id)) errs.push(`duplicate lifecycle stage id "${s.id}"`);
          else stageIds.add(s.id);
          if (typeof s.label !== "string") errs.push(`lifecycle.stages[${i}].label must be string`);
          else if (s.label.length > 80 || /[<>]/.test(s.label)) errs.push(`lifecycle.stages[${i}].label must be ≤80 chars and free of < >`);
          for (const k of ["description","exit"]) {
            if (s[k] != null && (typeof s[k] !== "string" || /[<>]/.test(s[k]) || s[k].length > 500))
              errs.push(`lifecycle.stages[${i}].${k} must be ≤500-char string and free of < >`);
          }
        }
        if (typeof p.lifecycle.current !== "string" || !stageIds.has(p.lifecycle.current))
          errs.push(`lifecycle.current "${p.lifecycle.current}" not in stages[]`);
      }
    }
  }
  const stateIds = new Set();
  for (const [i, s] of p.states.entries()) {
    if (!s || typeof s.id !== "string" || typeof s.label !== "string" || typeof s.color !== "string")
      errs.push(`states[${i}] must have id/label/color strings`);
    else if (stateIds.has(s.id)) errs.push(`duplicate state id "${s.id}"`);
    else stateIds.add(s.id);
  }
  const seenIds = new Set();
  const allowedFields = new Set(["id","name","category","status","progress","owner","notes","docs","updatedAt","stage"]);
  const stageIdSet = new Set((p.lifecycle?.stages || []).map(s => s.id));
  const HEX = /^#[0-9a-fA-F]{6}$/;
  for (const [i, s] of p.states.entries()) {
    if (s && typeof s.color === "string" && !HEX.test(s.color)) errs.push(`states[${i}].color must be #rrggbb`);
  }
  for (const [i, a] of p.areas.entries()) {
    if (!a || typeof a !== "object") { errs.push(`areas[${i}] must be object`); continue; }
    for (const k of Object.keys(a)) if (!allowedFields.has(k)) errs.push(`areas[${i}] has unknown field "${k}"`);
    if (typeof a.id !== "string" || !a.id) errs.push(`areas[${i}].id required`);
    else if (seenIds.has(a.id)) errs.push(`duplicate area id "${a.id}"`);
    else seenIds.add(a.id);
    if (typeof a.name !== "string") errs.push(`areas[${i}].name must be string`);
    if (typeof a.category !== "string") errs.push(`areas[${i}].category must be string`);
    else if (a.category.length > 80 || /[<>]/.test(a.category)) errs.push(`areas[${i}].category must be ≤80 chars and free of < >`);
    if (typeof a.status !== "string" || !stateIds.has(a.status)) errs.push(`areas[${i}].status "${a.status}" not in states[]`);
    if (typeof a.progress !== "number" || !Number.isFinite(a.progress)) errs.push(`areas[${i}].progress must be number`);
    if (a.owner != null && typeof a.owner !== "string") errs.push(`areas[${i}].owner must be string`);
    if (a.notes != null && typeof a.notes !== "string") errs.push(`areas[${i}].notes must be string`);
    if (a.docs != null) {
      if (!Array.isArray(a.docs)) errs.push(`areas[${i}].docs must be string[]`);
      else for (const [j, d] of a.docs.entries()) {
        if (typeof d !== "string") { errs.push(`areas[${i}].docs[${j}] must be string`); continue; }
        // Bundle filenames only: positive allowlist [A-Za-z0-9._-], length <=200,
        // no path separators / metacharacters / control bytes, no traversal.
        if (d.length === 0 || d.length > 200) errs.push(`areas[${i}].docs[${j}] length out of range`);
        else if (!/^[A-Za-z0-9._-]+$/.test(d)) errs.push(`areas[${i}].docs[${j}] must match [A-Za-z0-9._-]`);
        else if (d.includes("..")) errs.push(`areas[${i}].docs[${j}] must not contain ..`);
      }
    }
    if (a.stage != null && (typeof a.stage !== "string" || (stageIdSet.size && !stageIdSet.has(a.stage)))) errs.push(`areas[${i}].stage "${a.stage}" not in lifecycle.stages[]`);
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

  // ---------- /api/code-activity ----------
  // Returns recent commits from a sibling code repo (default: ./telecheck-app).
  // Read-only; runs `git log` against the local clone.
  if (reqPath === "/api/code-activity") {
    if (req.method !== "GET") { res.writeHead(405); return res.end("Method not allowed"); }
    const REPO = path.join(ROOT, "telecheck-app");
    if (!fs.existsSync(path.join(REPO, ".git"))) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ ok: true, repo: null, commits: [] }));
    }
    const { spawn } = require("child_process");
    // ISO date | short hash | author | subject — unit-separated records, NUL between.
    const fmt = "%cI%x1f%h%x1f%an%x1f%s%x00";
    const proc = spawn("git", ["-C", REPO, "log", "-n", "20", `--pretty=format:${fmt}`], { windowsHide: true });
    let out = "", err = "";
    proc.stdout.on("data", c => { out += c.toString("utf8"); if (out.length > 1e6) proc.kill(); });
    proc.stderr.on("data", c => { err += c.toString("utf8"); });
    proc.on("close", code => {
      if (code !== 0) {
        res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
        return res.end(JSON.stringify({ ok: false, error: err.slice(0, 200) }));
      }
      const commits = out.split("\0").filter(Boolean).map(rec => {
        const [date, sha, author, subject] = rec.split("\x1f");
        return { date, sha, author, subject };
      });
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-cache" });
      res.end(JSON.stringify({ ok: true, repo: "telecheck-app", commits }));
    });
    return;
  }

  // ---------- /api/progress ----------
  if (reqPath === "/api/progress") {
    if (req.method === "GET") {
      fs.readFile(PROGRESS_FILE, "utf8", (err, data) => {
        if (err) { res.writeHead(404); return res.end("progress.json missing"); }
        let rev = 0;
        try { rev = JSON.parse(data).revision || 0; } catch {}
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache",
          "ETag": `"r${rev}"`,
        });
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
        // Optimistic concurrency: require If-Match header matching current revision.
        let prevDoc = {};
        try { prevDoc = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8")); } catch {}
        const currentRev = prevDoc.revision || 0;
        const ifMatchRaw = req.headers["if-match"] || "";
        const ifMatch = (ifMatchRaw.match(/r(\d+)/) || [])[1];
        if (ifMatch == null) {
          res.writeHead(428, { "Content-Type": "application/json; charset=utf-8" });
          return res.end(JSON.stringify({ ok:false, error:"missing If-Match header", currentRevision: currentRev }));
        }
        if (Number(ifMatch) !== currentRev) {
          res.writeHead(409, { "Content-Type": "application/json; charset=utf-8", "ETag": `"r${currentRev}"` });
          return res.end(JSON.stringify({ ok:false, error:"revision conflict", expectedRevision: Number(ifMatch), currentRevision: currentRev, current: prevDoc }));
        }
        // Stamp updatedAt on areas whose tracked fields changed.
        const now = new Date().toISOString();
        const prevAreas = prevDoc.areas || [];
        const prev = new Map(prevAreas.map(a => [a.id, a]));
        const tracked = ["status","progress","owner","notes"];
        let changed = 0;
        for (const a of parsed.areas) {
          const p = prev.get(a.id);
          const diff = !p || tracked.some(k => (a[k] ?? "") !== (p[k] ?? ""))
            || JSON.stringify(a.docs||[]) !== JSON.stringify(p?.docs||[]);
          if (diff) { a.updatedAt = now; changed++; }
          else if (p?.updatedAt) { a.updatedAt = p.updatedAt; }
        }
        parsed.schema = parsed.schema || 1;
        parsed.updated = now.slice(0,10);
        parsed.updatedAt = now;
        parsed.revision = currentRev + 1;
        atomicWriteJson(PROGRESS_FILE, parsed);
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "ETag": `"r${parsed.revision}"`,
        });
        res.end(JSON.stringify({ ok: true, updated: parsed.updated, updatedAt: now, revision: parsed.revision, changed, areas: parsed.areas.length }));
        const ts = now.slice(11,19);
        console.log(`[${ts}] 200 PUT /api/progress (rev ${currentRev}→${parsed.revision}, ${changed} changed)`);
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

// Boot-time self-check: refuse to start if the seed file would fail validation.
// Catches the case where someone hand-edits progress.json into a state the
// server itself would reject on every subsequent PUT.
try {
  if (fs.existsSync(PROGRESS_FILE)) {
    const seed = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
    const seedErrs = validateProgress(seed);
    if (seedErrs.length) {
      console.error("FATAL: progress.json fails validation; refusing to start.");
      for (const e of seedErrs) console.error("  - " + e);
      process.exit(2);
    }
  }
} catch (e) {
  console.error("FATAL: could not read/parse progress.json:", e.message);
  process.exit(2);
}

server.listen(PORT, HOST, () => {
  console.log(`Telecheck Command Center → http://${HOST}:${PORT}/`);
  console.log(`Serving: ${ROOT}`);
  console.log(`Stop with Ctrl+C`);
});
