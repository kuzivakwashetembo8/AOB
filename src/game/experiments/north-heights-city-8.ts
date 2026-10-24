/**
 * GTD-NH-REBUILD-001 — isolated, non-production, procedural North Heights.
 * Rejected City Pack 8 remains a reference image only; ZERO runtime model imports.
 * No generated South Ward, Rapier colliders, traffic, or game-session runtime.
 */
import {
  AbstractMesh, Color3, Color4, DirectionalLight, Engine, FreeCamera,
  HemisphericLight, Ray, Scene, SceneLoader, TransformNode, Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { configureLocalGameDecoders } from "@/game/core/local-decoders";
import { buildNorthHeightsReconstruction, northHeightsGround } from "./north-heights-reconstruction-001";
import { placeNorthHeightsTrees004 } from "./north-heights-trees-004";
import { createNorthHeightsSky, type NorthHeightsTime } from "./north-heights-sky-002";

type Control = "forward" | "back" | "left" | "right" | "up" | "down" | "fast";
export interface NorthHeightsInspection {
  press: (control: Control, down: boolean) => void;
  reset: () => void;
  setTime: (time: NorthHeightsTime) => void;
  dispose: () => void;
}
type Bounds = { min: Vector3; max: Vector3; size: Vector3; center: Vector3 };

function boundsOf(meshes: readonly AbstractMesh[]): Bounds {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  let found = 0;
  for (const mesh of meshes) {
    if (mesh.getTotalVertices() < 1) continue;
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    if (![box.minimumWorld.x, box.minimumWorld.y, box.minimumWorld.z,
      box.maximumWorld.x, box.maximumWorld.y, box.maximumWorld.z].every(Number.isFinite)) continue;
    min.minimizeInPlace(box.minimumWorld);
    max.maximizeInPlace(box.maximumWorld);
    found += 1;
  }
  if (!found) throw new Error("Asset contains no measurable renderable geometry.");
  const size = max.subtract(min);
  return { min, max, size, center: min.add(max).scale(0.5) };
}
function topLevelNodes(imported: Awaited<ReturnType<typeof SceneLoader.ImportMeshAsync>>) {
  return [...new Set([...imported.transformNodes, ...imported.meshes])]
    .filter(node => !node.parent);
}
async function loadWitness(scene: Scene, file: string, name: string, x: number, y: number, z: number) {
  const imported = await SceneLoader.ImportMeshAsync("", "/GLBs/Characters/", file, scene);
  for (const group of imported.animationGroups) group.stop();
  const meshes = imported.meshes.filter(mesh => mesh.getTotalVertices() > 0);
  const b = boundsOf(meshes);
  const height = Math.max(0.001, b.size.y);
  // Babylon glTF authors use different coordinate systems and root scales.
  // Preserve original hierarchy and fit each model to 1.78m for this visual trial.
  const scale = 1.78 / height;
  const root = new TransformNode("nh001-" + name, scene);
  for (const node of topLevelNodes(imported)) node.parent = root;
  root.scaling.setAll(scale);
  root.position.set(x - b.center.x * scale, y - b.min.y * scale, z - b.center.z * scale);
  for (const mesh of meshes) mesh.isPickable = false;
  if (file === "ual.glb") {
    const idle = imported.animationGroups.find(group => group.name.toLowerCase() === "idle_loop")
      ?? imported.animationGroups.find(group => group.name.toLowerCase().includes("idle"));
    idle?.start(true);
  }
  return meshes.length;
}
export async function createNorthHeightsCity8(
  canvas: HTMLCanvasElement,
  status: (message: string) => void,
  statistics: (message: string) => void,
): Promise<NorthHeightsInspection> {
  configureLocalGameDecoders();
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false }, true);
  const scene = new Scene(engine);
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  scene.clearColor = new Color4(0.68, 0.78, 0.86, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.00115;
  scene.fogColor = new Color3(0.67,0.76,0.83);
  scene.shadowsEnabled = false;
  scene.skipPointerMovePicking = true;
  scene.ambientColor = new Color3(0.66, 0.68, 0.73);
  const hemi = new HemisphericLight("nh001-hemi", new Vector3(0.3, 1, 0), scene);
  hemi.intensity = 1.15;
  const sun = new DirectionalLight("nh001-daylight", new Vector3(-0.6, -1, 0.4), scene);
  sun.intensity = 1.20;
  const sky = createNorthHeightsSky(scene,sun,hemi,mobile);
  // Reduce cost on memory-constrained mobiles before any 3D assets are loaded.
  engine.setHardwareScalingLevel(mobile ? 1.75 : 1.1);
  const camera = new FreeCamera("nh001-fly-camera", new Vector3(0, 10, -20), scene);
  camera.minZ = 0.1;
  camera.maxZ = 10000;
  camera.fov = 1.05;
  scene.activeCamera = camera;
  const held = new Set<Control>();
  const keys = new Set<string>();
  let yaw = 0, pitch = 0, closed = false, anchor = new Vector3(0, 4, -15);
  let treeHandle: {dispose:()=>void} | null = null;
  let initialYaw = 0, initialPitch = 0;
  let dragPointer: number | null = null, lastX = 0, lastY = 0;
  let frames = 0;
  const keyDown = (event: KeyboardEvent) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    keys.add(event.code);
  };
  const keyUp = (event: KeyboardEvent) => { keys.delete(event.code); };
  const clearKeys = () => { keys.clear(); held.clear(); dragPointer = null; };
  const pointerDown = (event: PointerEvent) => {
    if (dragPointer !== null) return;
    dragPointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent) => {
    if (dragPointer !== event.pointerId) return;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    lastX = event.clientX; lastY = event.clientY;
    yaw += dx * 0.004;
    pitch = Math.max(-1.48, Math.min(1.48, pitch + dy * 0.004));
  };
  const pointerUp = (event: PointerEvent) => {
    if (dragPointer === event.pointerId) dragPointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const resize = () => { engine.resize(); };
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  window.addEventListener("keydown", keyDown, { passive: false });
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("resize", resize);
  scene.onBeforeRenderObservable.add(() => {
    const dt = Math.min(0.05, engine.getDeltaTime() / 1000);
    const key = (code: string) => keys.has(code);
    const active = (button: Control) => held.has(button);
    const x = Number(active("right") || key("ArrowRight") || key("KeyD"))
      - Number(active("left") || key("ArrowLeft") || key("KeyA"));
    const z = Number(active("forward") || key("ArrowUp") || key("KeyW"))
      - Number(active("back") || key("ArrowDown") || key("KeyS"));
    const y = Number(active("up") || key("Space") || key("KeyE"))
      - Number(active("down") || key("ControlLeft") || key("ControlRight") || key("KeyQ"));
    const heading = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const side = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const move = heading.scale(z).add(side.scale(x)).add(new Vector3(0, y, 0));
    if (move.lengthSquared() > 0) {
      const speed = (active("fast") || key("ShiftLeft") || key("ShiftRight")) ? 87 : 24;
      camera.position.addInPlace(move.normalize().scale(speed * dt));
    }
    camera.rotation.set(pitch, yaw, 0);
    if (++frames % 40 === 0) statistics(
      "FPS " + Math.round(engine.getFps()) + " · " +
      "CAM " + camera.position.x.toFixed(1) + ", " +
      camera.position.y.toFixed(1) + ", " + camera.position.z.toFixed(1));
  });
  engine.runRenderLoop(() => { if (!closed) scene.render(); });
  const controller: NorthHeightsInspection = {
    press(control, down) { if (down) held.add(control); else held.delete(control); },
    reset() { camera.position.copyFrom(anchor); yaw = initialYaw; pitch = initialPitch; clearKeys(); },
    setTime(time) { sky.setTime(time); },
    dispose() {
      if (closed) return;
      closed = true;
      engine.stopRenderLoop();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearKeys);
      window.removeEventListener("resize", resize);
      treeHandle?.dispose(); sky.dispose(); scene.dispose(); engine.dispose();
    },
  };
  const started = performance.now();
  try {
    status("Generating North Heights · native roads, towers, terraces and facades");
    const world = buildNorthHeightsReconstruction(scene,mobile);
    if (closed) return controller;
    status("North Heights roads joined · loading original owner-committed tree GLB");
    let treeCount=0, treeInstances=0, treeError="";
    try {
      const realized=await placeNorthHeightsTrees004(scene,world.treeLocations);
      if(closed){ realized.dispose(); return controller; }
      treeHandle=realized;
      treeCount=realized.trees;
      treeInstances=realized.meshInstances;
      console.info("[NH-REBUILD-004] user tree GLB instancing",{
        trees:treeCount,meshesPerTree:realized.sourceMeshes,
        meshInstances:treeInstances,generatedCanopyMeshes:0,
      });
    } catch(cause){
      treeError=cause instanceof Error?cause.message:String(cause);
      console.error("[NH-REBUILD-004] Tree GLB failed to load",cause);
    }
    // Fixed visual witnesses are placed at a public street-level observation area.
    // Their shared source assets remain in GTD; they are not copied from city pack 8.
    const spawn = new Vector3(world.focus.x,northHeightsGround(world.focus.x,world.focus.z)+0.03,world.focus.z);
    const witnesses = [
      ["character.glb", "voight", spawn.x - 2.4, spawn.y, spawn.z],
      ["ual.glb", "ual", spawn.x + 2.4, spawn.y, spawn.z],
    ] as const;
    let actorCount = 0, failed = 0;
    status("Native district ready · positioning character.glb and UAL");
    for (const [file,name,x,y,z] of witnesses) {
      try {
        actorCount += await loadWitness(scene,file,name,x,y,z);
      } catch (error) {
        failed++;
        console.error("[NH-REBUILD-001] character witness failed",name,error);
      }
      if (closed) return controller;
    }
    anchor=world.overview.clone();
    camera.position.copyFrom(anchor);
    camera.setTarget(new Vector3(0,48,0));
    yaw=camera.rotation.y; pitch=camera.rotation.x;
    initialYaw=yaw; initialPitch=pitch;
    status("North Heights reconstruction ready · "+world.count+
      " original buildings · "+world.streetCount+" connected street axes · "+
      (world.instanceCount+treeInstances).toLocaleString()+" geometry instances · "+
      treeCount+" GLB trees · "+actorCount+" character meshes"+(treeError?" · TREE IMPORT FAILED: "+treeError:"")+(failed?" · "+failed+" character imports failed":"")+
      " · "+Math.round(performance.now()-started)+" ms");
  } catch (error) {
    status("North Heights reconstruction failed: "+(error instanceof Error?error.message:String(error)));
    console.error("[NH-REBUILD-001] procedural generation failed",error);
  }
  return controller;
}
