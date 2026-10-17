/** Make vite-plugin-pwa generated service-worker files visible to Nitro/Vercel.
 *
 * vite-plugin-pwa emits dist/sw.js and dist/workbox-<hash>.js, but Nitro deploys
 * .vercel/output/static. Without this copy, deployed /sw.js returns 404 even
 * though the Vite build prints "dist/sw.js". No runtime network dependency.
 */
import {
  copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync,
} from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const generated = join(root, "dist");
const published = join(root, ".vercel", "output", "static");
const sw = join(generated, "sw.js");

if (!existsSync(sw)) {
  throw new Error("PWA build failed: generated dist/sw.js does not exist");
}

if (!existsSync(published)) {
  if (process.env.VERCEL === "1" || process.env.VERCEL === "true") {
    throw new Error("PWA build failed: expected Nitro .vercel/output/static");
  }
  console.info("[pwa] Local non-Vercel build: dist/sw.js exists; no Nitro output to publish to");
} else {
  const generatedFiles = readdirSync(generated);
  const workerCode = readFileSync(sw, "utf8");
  const referencedWorkbox = [...new Set(
    workerCode.match(/workbox-[A-Za-z0-9_-]+\.js/g) ?? [],
  )];
  // Retain every generated Workbox module, including references that may
  // change hashes when Vite / Workbox is upgraded.
  const dependencies = [...new Set([
    ...referencedWorkbox,
    ...generatedFiles.filter((file) => /^workbox-[A-Za-z0-9_-]+\.js$/.test(file)),
  ])];
  for (const file of ["sw.js", ...dependencies]) {
    const source = join(generated, file);
    if (!existsSync(source) || statSync(source).size === 0) {
      throw new Error("[pwa] Generated service-worker dependency missing: " + file);
    }
  }
  mkdirSync(published, { recursive: true });
  for (const file of ["sw.js", ...dependencies]) {
    copyFileSync(join(generated, file), join(published, file));
  }
  // Deploy metadata is written AFTER the Nitro output exists. Static manifests
  // serve from the same exact Vercel deployment as its immutable JS/CSS chunks.
  // Neither GitHub main HEAD nor a third-party endpoint is queried at runtime.
  const releaseId = process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ?? "development";
  const environment = process.env.VERCEL_ENV ?? "development";
  if ((process.env.VERCEL === "1" || process.env.VERCEL === "true") &&
    !/^[a-f\d]{40}$/.test(releaseId)) {
    throw new Error("[REL-010] Production/preview release requires an immutable Git SHA");
  }
  writeFileSync(join(published, "build-version.json"), JSON.stringify({
    schema: "gtd-release-v1", releaseId, environment,
    builtAt: new Date().toISOString(),
  }));
  console.info("[REL-010] Published immutable deployed release metadata: " + releaseId);
  console.info("[pwa] Published /sw.js and " + dependencies.length +
    " Workbox dependency file(s) to Nitro static output");
}
