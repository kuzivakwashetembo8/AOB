import { DracoDecoder } from "@babylonjs/core/Meshes/Compression/dracoDecoder";

/**
 * OFFLINE-001: Babylon's default Draco config points to a remote CDN.
 * This must execute before any glTF/GLB begins loading.
 */
export function configureLocalGameDecoders(): void {
  DracoDecoder.DefaultConfiguration = {
    wasmUrl: "/offline001/draco/draco_wasm_wrapper_gltf.js",
    wasmBinaryUrl: "/offline001/draco/draco_decoder_gltf.wasm",
    fallbackUrl: "/offline001/draco/draco_decoder_gltf.js",
  };
}
