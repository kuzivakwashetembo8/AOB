import { SceneInstrumentation, type Engine, type Scene } from "@babylonjs/core";
import { approximateFps, percentile, renderScaleCoverage } from "./fl4-metrics";

export type FL4Sample = Readonly<{
  frameMs: number;
  renderMs: number;
  drawCalls: number | null;
  activeMeshes: number;
  activeIndices: number;
}>;

export type FL4Report = Readonly<{
  schema: "gtd.fl4.v1";
  enabled: true;
  timestamp: string;
  browser: string;
  viewport: { width: number; height: number; dpr: number };
  canvas: { cssWidth: number; cssHeight: number; backingWidth: number; backingHeight: number };
  render: { width: number; height: number; hardwareScalingLevel: number };
  scene: { meshCount: number; materialCount: number; textureCount: number; shadowCasterCount: number; shadowMapSize: number | null };
  pixelCoverage: { expectedNativePixels: number; actualPixels: number; nativeCoveragePercent: number | null };
  timing: { bootToReadyMs: number | null; firstFrameMs: number | null };
  samples: { count: number; frameMsP50: number | null; frameMsP95: number | null; renderMsP50: number | null; renderMsP95: number | null; fpsApprox: number | null; drawCallsP50: number | null; activeMeshesP50: number | null; activeIndicesP50: number | null };
  unavailable: string[];
}>;


/**
 * Opt-in snapshot data only. Read from a browser console:
 *   window.__GTD_FL4_REPORT__?.()
 * Enable by opening /game?fl4Diagnostics=1 and reload to start a sample.
 * This does not mutate gameplay simulation or React state.
 */
export class FL4Diagnostics {
  private readonly samples: FL4Sample[] = [];
  private previousFrameTime: number | null = null;
  private bootToReadyMs: number | null = null;
  private firstFrameMs: number | null = null;
  private readonly instrumentation: SceneInstrumentation;

  constructor(
    private readonly engine: Engine,
    private readonly scene: Scene,
    private readonly canvas: HTMLCanvasElement,
  ) {
    this.instrumentation = new SceneInstrumentation(scene);
  }

  recordFrame(now: number, renderMs: number) {
    if (this.previousFrameTime !== null) {
      const frameMs = now - this.previousFrameTime;
      if (frameMs > 0 && Number.isFinite(frameMs)) {
        this.samples.push({
          frameMs,
          renderMs,
          drawCalls: this.instrumentation.drawCallsCounter.current,
          activeMeshes: this.scene.getActiveMeshes().length,
          activeIndices: this.scene.getActiveIndices(),
        });
        if (this.samples.length > 1800) this.samples.shift();
      }
    }
    this.previousFrameTime = now;
  }

  recordStartup(bootToReadyMs: number, firstFrameMs: number) {
    this.bootToReadyMs = bootToReadyMs;
    this.firstFrameMs = firstFrameMs;
  }

  report(): FL4Report {
    const bounds = this.canvas.getBoundingClientRect();
    const frames = this.samples.map((v) => v.frameMs);
    const p50 = percentile(frames, 0.5);
    const shadowGenerators = this.scene.lights.flatMap((light) => light.getShadowGenerators ? [...(light.getShadowGenerators()?.values() ?? [])] : []);
    const mainShadow = shadowGenerators[0];
    const shadowMap = mainShadow?.getShadowMap();
    const shadowCasters = shadowMap?.renderList ?? [];
    return {
      schema: "gtd.fl4.v1",
      enabled: true,
      timestamp: new Date().toISOString(),
      browser: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      canvas: {
        cssWidth: bounds.width, cssHeight: bounds.height,
        backingWidth: this.canvas.width, backingHeight: this.canvas.height,
      },
      render: {
        width: this.engine.getRenderWidth(),
        height: this.engine.getRenderHeight(),
        hardwareScalingLevel: this.engine.getHardwareScalingLevel(),
      },
      scene: {
        meshCount: this.scene.meshes.length,
        materialCount: this.scene.materials.length,
        textureCount: this.scene.textures.length,
        shadowCasterCount: shadowCasters.length,
        shadowMapSize: shadowMap ? shadowMap.getSize().width : null,
      },
      pixelCoverage: renderScaleCoverage({ cssWidth: bounds.width, cssHeight: bounds.height, renderWidth: this.engine.getRenderWidth(), renderHeight: this.engine.getRenderHeight(), devicePixelRatio }),
      timing: { bootToReadyMs: this.bootToReadyMs, firstFrameMs: this.firstFrameMs },
      samples: {
        count: frames.length,
        frameMsP50: p50,
        frameMsP95: percentile(frames, 0.95),
        renderMsP50: percentile(this.samples.map((v) => v.renderMs), 0.5),
        renderMsP95: percentile(this.samples.map((v) => v.renderMs), 0.95),
        fpsApprox: approximateFps(p50),
        drawCallsP50: percentile(this.samples.map((v) => v.drawCalls).filter((v): v is number => v !== null), 0.5),
        activeMeshesP50: percentile(this.samples.map((v) => v.activeMeshes), 0.5),
        activeIndicesP50: percentile(this.samples.map((v) => v.activeIndices), 0.5),
      },
      unavailable: [
        "GPU timer: not measured",
        "GPU memory: browser API unavailable",
        "Thermal state: browser API unavailable",
        "Scene texture byte sizes: not instrumented",
      ],
    };
  }

  dispose() {
    this.instrumentation.dispose();
    this.reset();
  }

  reset() {
    this.samples.length = 0;
    this.previousFrameTime = null;
  }
}
