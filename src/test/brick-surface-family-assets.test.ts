import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BRICK_FAMILY_ID, BRICK_SURFACE_IDS, BRICK_SURFACES,
  brickSurfaceById, brickTileMetres,
} from "../game/world-generation/brick-surface-catalog";
import { BRICK_TRIAL_ASSET_PATH, BRICK_TRIAL_ASSIGNMENTS } from "../game/world-generation/experimental-brick-material";

type Entry = { id: string; path: string; widthPx: number; heightPx: number;
  gitBlobSha: string; status: string; sizeBytes: number };
type Manifest = { familyId: string; surfaces: Entry[] };
const root = join(process.cwd(), "public");
const manifest = JSON.parse(readFileSync(
  join(root, "assets/surfaces/brick/brick-family-manifest.json"), "utf8")) as Manifest;

function webpDimensions(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  const type = bytes.subarray(12, 16).toString("ascii");
  if (type === "VP8 ") {
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  }
  if (type === "VP8X") {
    return {
      width: 1 + bytes[24]! + (bytes[25]! << 8) + (bytes[26]! << 16),
      height: 1 + bytes[27]! + (bytes[28]! << 8) + (bytes[29]! << 16),
    };
  }
  throw new Error("Unsupported WebP chunk: " + type);
}

describe("MAT-004 canonical brick assets", () => {
  it("defines exactly ten stable surface IDs and makes only BRK-01 accepted", () => {
    expect(BRICK_FAMILY_ID).toBe("WALL-01");
    expect(BRICK_SURFACE_IDS).toHaveLength(10);
    expect(Object.keys(BRICK_SURFACES).sort()).toEqual([...BRICK_SURFACE_IDS].sort());
    expect(brickSurfaceById("BRK-01").status).toBe("accepted");
    for (const id of BRICK_SURFACE_IDS.slice(1)) {
      expect(brickSurfaceById(id).status).toBe("asset-committed");
    }
  });

  it("verifies all actual WebP headers, dimensions, size, Git blob hash and manifest parity", () => {
    expect(manifest.familyId).toBe("WALL-01");
    expect(manifest.surfaces).toHaveLength(10);
    for (const asset of Object.values(BRICK_SURFACES)) {
      const listed = manifest.surfaces.find(s => s.id === asset.id);
      expect(listed).toEqual(asset);
      const bytes = readFileSync(join(root, asset.path.slice(1)));
      expect(bytes.length).toBe(asset.sizeBytes);
      expect(webpDimensions(bytes)).toEqual({
        width: asset.widthPx, height: asset.heightPx,
      });
      const blobHash = createHash("sha1")
        .update(Buffer.from("blob " + bytes.length + "\0"))
        .update(bytes)
        .digest("hex");
      expect(blobHash).toBe(asset.gitBlobSha);
    }
  });

  it("preserves live apartment and garage material paths and an identical canonical BRK-01 copy", () => {
    expect(BRICK_TRIAL_ASSET_PATH).toBe("/brick-wall-image.webp");
    const live = readFileSync(join(root, "brick-wall-image.webp"));
    const canonical = readFileSync(join(root,
      "assets/surfaces/brick/brk-01-warm-red.webp"));
    expect(live.equals(canonical)).toBe(true);
    expect(Object.keys(BRICK_TRIAL_ASSIGNMENTS).sort())
      .toEqual(["sw-fl-garage", "sw-fl-south-apartment"]);
  });

  it("records the slight intrinsic dimension difference without stretching surfaces", () => {
    expect([BRICK_SURFACES["BRK-01"].widthPx,
      BRICK_SURFACES["BRK-01"].heightPx]).toEqual([1774, 871]);
    for (const id of BRICK_SURFACE_IDS.slice(1)) {
      const a = BRICK_SURFACES[id];
      expect([a.widthPx, a.heightPx]).toEqual([1790, 879]);
      expect(a.widthPx / a.heightPx).toBeCloseTo(1774 / 871, 2);
      const m = brickTileMetres(id, 1.35);
      expect(m.height / m.width).toBeCloseTo(a.heightPx / a.widthPx, 9);
    }
    expect(() => brickTileMetres("BRK-01", 0)).toThrow(RangeError);
  });
});
