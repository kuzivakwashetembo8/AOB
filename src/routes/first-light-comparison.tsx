import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";
import type {
  FirstLightComparisonRuntime,
  FirstLightComparisonStats,
} from "@/game/world/first-light-comparison";

export const Route = createFileRoute("/first-light-comparison")({
  head: () =>
    pageHead(
      "First Light comparison",
      "Pre-main comparison of the authored First Light scene and the generated Meridian city system.",
    ),
  component: FirstLightComparisonPage,
});

function ComparisonPanel({
  title,
  subtitle,
  canvasRef,
}: {
  title: string;
  subtitle: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  return (
    <section className="min-w-0 border border-border bg-background/80">
      <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <div className="system-label text-primary">{title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <canvas
        ref={canvasRef}
        className="block h-[58vh] min-h-[360px] w-full bg-background"
        aria-label={title}
      />
    </section>
  );
}

function FirstLightComparisonPage() {
  const authoredCanvas = useRef<HTMLCanvasElement>(null);
  const generatedCanvas = useRef<HTMLCanvasElement>(null);
  const runtime = useRef<FirstLightComparisonRuntime | null>(null);
  const [stats, setStats] = useState<FirstLightComparisonStats | null>(null);
  const [status, setStatus] = useState("INITIALIZING BOTH FIRST LIGHT VIEWS");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const authored = authoredCanvas.current;
      const generated = generatedCanvas.current;
      if (!authored || !generated) return;

      try {
        const { bootstrapFirstLightComparison } = await import(
          "@/game/world/first-light-comparison"
        );
        const comparison = await bootstrapFirstLightComparison(
          authored,
          generated,
        );
        if (cancelled) {
          comparison.dispose();
          return;
        }
        runtime.current = comparison;
        setStats(comparison.stats);
        setStatus("COMPARISON READY");
      } catch (error) {
        console.error("First Light comparison bootstrap failed", error);
        setStatus("COMPARISON BOOT FAILED");
      }
    })();

    return () => {
      cancelled = true;
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-4 text-foreground md:px-6">
      <header className="mx-auto mb-4 flex max-w-[1600px] flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="system-label text-primary">
            MERIDIAN // CONTROLLED INTEGRATION
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            FIRST LIGHT COMPARISON
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Authored runtime on the left. Step 1–5 generated architecture,
            physical contracts, and semantic road structure on the right. This
            route is a pre-main verification surface, not a replacement for the
            live game.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="control" asChild>
            <Link to="/game">
              <ArrowLeft size={14} /> GAME
            </Link>
          </Button>
          <Button variant="control" asChild>
            <Link to="/world">
              WORLD <ExternalLink size={14} />
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto mb-4 grid max-w-[1600px] gap-3 border border-border bg-card/60 p-3 text-xs md:grid-cols-5">
        <div>
          <div className="system-label">STATUS</div>
          <strong>{status}</strong>
        </div>
        <div>
          <div className="system-label">BUILDINGS</div>
          <strong>{stats?.buildingCount ?? "—"}</strong>
        </div>
        <div>
          <div className="system-label">ROAD SEGMENTS</div>
          <strong>{stats?.roadSegmentCount ?? "—"}</strong>
        </div>
        <div>
          <div className="system-label">GENERATED MESHES</div>
          <strong>{stats?.generatedMeshCount ?? "—"}</strong>
        </div>
        <div>
          <div className="system-label">GENERATED COLLIDERS</div>
          <strong>{stats?.generatedColliderCount ?? "—"}</strong>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-4 lg:grid-cols-2">
        <ComparisonPanel
          title="AUTHORED FIRST LIGHT"
          subtitle="Current accepted South Ward scene. Visual regression oracle."
          canvasRef={authoredCanvas}
        />
        <ComparisonPanel
          title="GENERATED FIRST LIGHT"
          subtitle="Step 1–5 building generation with semantic roads and real Rapier collision."
          canvasRef={generatedCanvas}
        />
      </div>

      <footer className="mx-auto mt-4 max-w-[1600px] border border-border bg-card/60 p-4 text-xs text-muted-foreground">
        Comparison scope: building massing, facade grammar, openings,
        materials, LOD-capable representation, collision, and road topology.
        Trees, parked vehicles, streetlights, lane markings, drainage, and
        finished generated curb meshes remain authored-only and should not be
        interpreted as parity failures at this gate.
      </footer>
    </main>
  );
}
