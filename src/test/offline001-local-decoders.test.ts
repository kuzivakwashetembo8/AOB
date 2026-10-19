import { describe, expect, it } from "vitest";
import { DracoDecoder } from "@babylonjs/core/Meshes/Compression/dracoDecoder";
import { configureLocalGameDecoders } from "../game/core/local-decoders";

describe("OFFLINE-001 decoder closure", () => {
  it("never configures Babylon Draco to fetch its default external CDN", () => {
    configureLocalGameDecoders();
    expect(DracoDecoder.DefaultConfiguration).toEqual({
      wasmUrl: "/offline001/draco/draco_wasm_wrapper_gltf.js",
      wasmBinaryUrl: "/offline001/draco/draco_decoder_gltf.wasm",
      fallbackUrl: "/offline001/draco/draco_decoder_gltf.js",
    });
    for (const url of Object.values(DracoDecoder.DefaultConfiguration)) {
      if (typeof url === "string") expect(url.startsWith("/offline001/draco/")).toBe(true);
    }
  });
});
