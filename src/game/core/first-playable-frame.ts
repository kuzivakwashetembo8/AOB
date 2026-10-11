import type { Scene } from "@babylonjs/core";

/**
 * Submit the real first Babylon frame instead of awaiting global scene
 * readiness before the renderer has been allowed to render at all.
 *
 * Calling Scene.render() alone is not proof a frame completed in all engine
 * states (for example a lost context). Babylon's actual after-render event
 * is the success signal. The gameplay overlay remains until this returns.
 */
export function renderFirstPlayableFrame(scene: Scene): void {
  let rendered = false;
  const observer = scene.onAfterRenderObservable.add(() => {
    rendered = true;
  });
  try {
    scene.render();
  } finally {
    if (observer) scene.onAfterRenderObservable.remove(observer);
  }
  if (!rendered) {
    throw new Error("Babylon did not complete the first scene render");
  }
}
