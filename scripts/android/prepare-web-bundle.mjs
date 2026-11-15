import { createHash } from "node:crypto";
import {
  cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync,
} from "node:fs";
import { relative, resolve, sep } from "node:path";

const root = process.cwd();
const source = resolve(root, ".vercel", "output", "static");
const target = resolve(root, ".capacitor-web");
const required = [
  resolve(source, "_shell.html"),
  resolve(source, "build-version.json"),
  resolve(source, "offline003-game-manifest.json"),
];

for (const file of required) {
  if (!existsSync(file) || !statSync(file).isFile()) {
    throw new Error("[ANDROID-BUNDLE] Required web build output missing: " + relative(root, file));
  }
}

const release = JSON.parse(readFileSync(required[1], "utf8"));
const manifest = JSON.parse(readFileSync(required[2], "utf8"));
const expectedRelease = process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA;
if (!/^[a-f0-9]{40}$/.test(release.releaseId ?? "") ||
    (expectedRelease && release.releaseId !== expectedRelease)) {
  throw new Error("[ANDROID-BUNDLE] Release ID must match the immutable source commit");
}
if (manifest.releaseId !== release.releaseId || !Array.isArray(manifest.resources) ||
    manifest.resources.length < 100) {
  throw new Error("[ANDROID-BUNDLE] Offline manifest/release mismatch or incomplete inventory");
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true, dereference: true });
cpSync(resolve(source, "_shell.html"), resolve(target, "index.html"));

const seen = new Set();
let verifiedBytes = 0;
for (const entry of manifest.resources) {
  if (typeof entry.url !== "string" || !entry.url.startsWith("/") ||
      entry.url.includes("?") || entry.url.includes("#") ||
      !/^[a-f0-9]{64}$/.test(entry.sha256 ?? "") ||
      !Number.isSafeInteger(entry.bytes) || entry.bytes < 0) {
    throw new Error("[ANDROID-BUNDLE] Invalid manifest entry: " + JSON.stringify(entry));
  }
  let decoded;
  try {
    decoded = entry.url.split("/").map((part) => decodeURIComponent(part)).join("/");
  } catch {
    throw new Error("[ANDROID-BUNDLE] Invalid URL encoding: " + entry.url);
  }
  const relativePath = decoded.replace(/^\/+/, "");
  if (!relativePath || relativePath.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("[ANDROID-BUNDLE] Unsafe manifest path: " + entry.url);
  }
  const normalized = resolve(target, relativePath);
  const rel = relative(target, normalized);
  if (!rel || rel.startsWith(".." + sep) || rel === ".." || seen.has(rel)) {
    throw new Error("[ANDROID-BUNDLE] Duplicate or escaping path: " + entry.url);
  }
  seen.add(rel);
  if (!existsSync(normalized) || !statSync(normalized).isFile()) {
    throw new Error("[ANDROID-BUNDLE] Manifest resource missing from packaged tree: " + entry.url);
  }
  const bytes = readFileSync(normalized);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (bytes.length !== entry.bytes || sha256 !== entry.sha256) {
    throw new Error("[ANDROID-BUNDLE] Resource integrity mismatch: " + entry.url);
  }
  verifiedBytes += bytes.length;
}

const indexHtml = readFileSync(resolve(target, "index.html"), "utf8");
if (!/<html[\s>]/i.test(indexHtml) || !/<script[\s>]/i.test(indexHtml)) {
  throw new Error("[ANDROID-BUNDLE] _shell.html is not a usable application entry document");
}
const resourceTags = indexHtml.match(/<(?:script|link|img|source)\b[^>]*>/gi) ?? [];
for (const tag of resourceTags) {
  const attr = /(?:src|href)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
  if (attr && /^(?:https?:)?\/\//i.test(attr)) {
    throw new Error("[ANDROID-BUNDLE] Remote entry-shell resource is not allowed: " + attr);
  }
}

const report = {
  schema: "poi-android-bundle-v1",
  appId: "com.interlinkglobal.poi",
  appName: "P.O.I",
  appVersion: "1.0.0",
  releaseId: release.releaseId,
  resourceCount: manifest.resources.length,
  verifiedBytes,
  entryDocument: "index.html",
  serviceWorker: "not registered by native application shell",
};
writeFileSync(resolve(target, "android-bundle-report.json"), JSON.stringify(report, null, 2) + "\n");
console.log("[ANDROID-BUNDLE] Verified " + report.resourceCount + " resources (" +
  verifiedBytes + " bytes) for " + release.releaseId);
