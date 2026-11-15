import { existsSync, readFileSync, writeFileSync } from "node:fs";

const gradle = "android/app/build.gradle";
if (!existsSync(gradle)) throw new Error("[ANDROID-CONFIG] Generated app/build.gradle is missing");
let source = readFileSync(gradle, "utf8");
const versionName = source.match(/versionName\s+["'][^"']+["']/g) ?? [];
if (versionName.length !== 1) {
  throw new Error("[ANDROID-CONFIG] Expected exactly one generated versionName declaration");
}
source = source.replace(/versionName\s+["'][^"']+["']/, 'versionName "1.0.0"');
if (!/applicationId\s+["']com\.interlinkglobal\.poi["']/.test(source)) {
  throw new Error("[ANDROID-CONFIG] Generated Android application ID does not match com.interlinkglobal.poi");
}
if (!/versionCode\s+1\b/.test(source)) {
  throw new Error("[ANDROID-CONFIG] Expected first-install versionCode 1");
}
writeFileSync(gradle, source);
console.log("[ANDROID-CONFIG] P.O.I package ID and version 1.0.0 verified");
