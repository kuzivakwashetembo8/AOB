import { createFileRoute } from "@tanstack/react-router";
import { BackLink, PageShell } from "@/ui/menus/shell";
import { pageHead } from "@/lib/page-head";
import { useSettings } from "@/ui/menus/settings-state";
import { SettingsEditor } from "@/ui/menus/settings-editor";
import { InstallAction } from "@/ui/menus/install-action";

export const Route = createFileRoute("/settings")({
  head: () => pageHead(
    "Settings",
    "Configure P.O.I graphics, audio, accessibility, interface, and ergonomic mobile controls.",
  ),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, save } = useSettings();
  return (
    <PageShell>
      <section className="page-content">
        <div className="page-top">
          <div className="min-w-0">
            <div className="system-label text-primary">P.O.I // SYSTEM CONFIGURATION</div>
            <h1 className="page-heading">SETTINGS<span className="text-primary">.</span></h1>
            <p className="page-subtitle">Your Meridian. Your way.</p>
          </div>
          <BackLink />
        </div>
        <InstallAction placement="settings" />
        <SettingsEditor initialSettings={settings} onApply={save} />
      </section>
    </PageShell>
  );
}
