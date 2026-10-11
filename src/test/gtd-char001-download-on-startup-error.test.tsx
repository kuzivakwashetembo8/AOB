// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BootstrapOverlay } from "../ui/menus/bootstrap";
import { composeCharacterTrialDownload } from "../game/character/character-trial-download";
import { initialStartupChecklist } from "../game/core/loading-checklist";

describe("GTD-CHAR-001 user-controlled failure evidence", () => {
  it("shows and invokes the data download control on an error without resuming the game", () => {
    const download = vi.fn();
    const view = render(
      <BootstrapOverlay
        entries={initialStartupChecklist()}
        error="GTD character trial: road witnesses missing"
        onDownloadDiagnostics={download}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Download character trial data/i }));
    expect(download).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Meridian could not finish startup/)).toBeTruthy();
    view.unmount();
  });
  it("does not show the export control outside a trial error", () => {
    const view = render(<BootstrapOverlay entries={initialStartupChecklist()} />);
    expect(screen.queryByRole("button", { name: /Download character trial data/i })).toBeNull();
    view.unmount();
  });
  it("includes exact check statuses, error, scene evidence and browser errors in one JSON object", () => {
    const scene = { witnessCandidates: { byMaterialCount: { asphalt: 4, sidewalk: 3 } } };
    const report = composeCharacterTrialDownload(
      "startup failed",
      initialStartupChecklist(),
      { scene },
      { capturedAt: "2026-10-11T15:00:00Z", userAgent: "Test Chrome", browserErrors: ["WebGL shader failed"] },
    );
    expect(report.schema).toBe("gtd.char001.startup-evidence.v1");
    expect(report.error).toBe("startup failed");
    expect(report.checkpoints).toHaveLength(8);
    expect(report.runtime).toEqual({ scene });
    expect(report.browserErrors).toEqual(["WebGL shader failed"]);
  });
});
