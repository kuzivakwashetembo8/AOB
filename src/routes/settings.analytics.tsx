import { createFileRoute } from "@tanstack/react-router";
import { BackLink, PageShell } from "@/ui/menus/shell";
import { pageHead } from "@/lib/page-head";
import { GameplayAnalyticsPanel } from "@/ui/menus/gameplay-analytics-panel";

export const Route = createFileRoute("/settings/analytics")({
  head: () => pageHead("Gameplay Analytics", "Review and export device-local P.O.I gameplay diagnostics."),
  component: GameplayAnalyticsPage,
});

function GameplayAnalyticsPage() {
  return (
    <PageShell>
      <section className="page-content">
        <div className="page-top">
          <div className="min-w-0">
            <div className="system-label text-primary">P.O.I // LOCAL DIAGNOSTICS</div>
            <h1 className="page-heading">GAMEPLAY ANALYTICS<span className="text-primary">.</span></h1>
            <p className="page-subtitle">Device-local session records. No account or network upload.</p>
          </div>
          <BackLink />
        </div>
        <div className="settings-panel" style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
          <h2 className="mb-4">Recorded sessions</h2>
          <GameplayAnalyticsPanel />
        </div>
      </section>
    </PageShell>
  );
}
