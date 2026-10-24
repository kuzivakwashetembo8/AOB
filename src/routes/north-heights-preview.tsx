import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { NorthHeightsInspection } from "@/game/experiments/north-heights-city-8";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/north-heights-preview")({
  head: () => pageHead("North Heights · Procedural Reconstruction", "Isolated, original procedural North Heights fly-through with Voight and UAL."),
  component: NorthHeightsPreview,
});
type FlightControl = Parameters<NorthHeightsInspection["press"]>[0];

function NorthHeightsPreview() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<NorthHeightsInspection | null>(null);
  const [status, setStatus] = useState("Preparing North Heights reconstruction");
  const [stats, setStats] = useState("");
  const [skyTime, setSkyTime] = useState<"day" | "dusk" | "night">("dusk");
  const [mode,setMode] = useState<"walk"|"fly">("walk");
  useEffect(() => {
    let closed = false;
    const start = async () => {
      try {
        const host = canvas.current;
        if (!host) return;
        const { createNorthHeightsCity8 } = await import("@/game/experiments/north-heights-city-8");
        if (closed) return;
        const instance = await createNorthHeightsCity8(host, message => {
          if (!closed) setStatus(message);
        }, message => { if (!closed) setStats(message); });
        if (closed) instance.dispose();
        else controller.current = instance;
      } catch (error) {
        if (!closed) setStatus("Viewport failure: " + (error instanceof Error ? error.message : String(error)));
      }
    };
    void start();
    return () => { closed = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  const hold = (control: FlightControl, down: boolean) => controller.current?.press(control, down);
  const control = (name: FlightControl, text: string, label: string) => (
    <button
      key={name} aria-label={label} type="button"
      className="select-none rounded border border-white/30 bg-black/65 px-3 py-2 text-sm font-semibold text-white active:bg-amber-400 active:text-black"
      style={{ minWidth: 52, minHeight: 44, touchAction: "none" }}
      onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); hold(name, true); }}
      onPointerUp={() => hold(name, false)}
      onPointerCancel={() => hold(name, false)}
      onLostPointerCapture={() => hold(name, false)}
    >{text}</button>
  );
  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-[#07111c] text-white">
      <canvas ref={canvas} aria-label="North Heights fly-through" className="absolute inset-0 h-full w-full"
        style={{ touchAction: "none", display: "block" }} />
      <div className="pointer-events-none absolute left-3 top-3 max-w-[75vw] rounded bg-black/65 p-3 text-xs md:text-sm">
        <div className="font-bold tracking-wide text-amber-400">MERIDIAN CITY // 05 NORTH HEIGHTS · REBUILD 005</div>
        <div className="mt-1" aria-live="polite">{status}</div>
        <div className="mt-1 text-white/65">{stats}</div>
        <div className="mt-1 text-white/65">{mode==="walk"?"Drag: look · Arrows/WASD: walk Voight · Space/E: jump · Shift: run":"Drag: look · Arrows/WASD: fly · Space/E: ascend · Q/Ctrl: descend · Shift: boost"}</div>
      </div>
      <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => {
          setSkyTime(current => {
            const next = current === "dusk" ? "night" : current === "night" ? "day" : "dusk";
            controller.current?.setTime(next);
            return next;
          });
        }} className="rounded border border-white/25 bg-black/70 px-3 py-2 text-xs"
          aria-label="Cycle North Heights sky between dusk, night and day">SKY: {skyTime.toUpperCase()}</button>
        <button type="button" onClick={() => {
          const next=mode==="walk"?"fly":"walk";
          if(controller.current?.setMode(next))setMode(next);
        }} className="rounded border border-amber-400/80 bg-amber-500 px-3 py-2 text-xs font-bold text-black" aria-label="Toggle North Heights walk or fly inspection">MODE: {mode.toUpperCase()}</button>
        <button type="button" onClick={() => controller.current?.reset()}
          className="rounded border border-white/25 bg-black/70 px-3 py-2 text-xs">RESET VIEW</button>
        <Link to="/world" className="rounded border border-white/25 bg-black/70 px-3 py-2 text-xs">WORLD DIRECTORY</Link>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
        <div className="pointer-events-auto grid grid-cols-3 gap-1">
          <div />
          {control("forward", "↑", "Fly forward")}
          <div />
          {control("left", "←", "Fly left")}
          {control("back", "↓", "Fly backward")}
          {control("right", "→", "Fly right")}
        </div>
        <div className="pointer-events-auto flex flex-wrap items-end justify-end gap-1">
          {control("up", mode==="walk"?"JUMP":"UP", mode==="walk"?"Jump":"Ascend")}
          {mode==="fly"?control("down", "DOWN", "Descend"):null}
          {control("fast", mode==="walk"?"RUN":"BOOST", mode==="walk"?"Sprint":"Fly faster")}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-28 right-3 max-w-56 text-right text-[10px] text-white/55">
        North Heights trial · Rapier walk/ground/building collisions · City Pack 8 by Pasha (design reference, CC BY 4.0)
      </div>
    </main>
  );
}
