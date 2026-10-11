// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BootstrapOverlay } from "../ui/menus/bootstrap";
import {
  composeCharacterTrialDownload,
  failedRuntimeModuleUrl,
  probeCharacterModuleRequest,
} from "../game/character/character-trial-download";
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
  it("recognizes the failed same-origin runtime asset without following arbitrary external URLs", () => {
    const origin = "https://gtd-preview.example";
    const message = "Failed to fetch dynamically imported module: https://gtd-preview.example/assets/gtd-runtime-DXWYBFon.js";
    expect(failedRuntimeModuleUrl(message, origin))
      .toBe("https://gtd-preview.example/assets/gtd-runtime-DXWYBFon.js");
    expect(failedRuntimeModuleUrl(message, "https://other.example")).toBeNull();
    expect(failedRuntimeModuleUrl("Render witness not drawn", origin)).toBeNull();
  });
  it("records actual HEAD status for a failed module request without importing or executing it", async () => {
    const url = "https://gtd-preview.example/assets/gtd-runtime-DXWYBFon.js";
    const request = vi.fn(async () => ({
      ok: false, status: 403, redirected: false, url,
      headers: { get: () => "text/html" },
    })) as unknown as typeof fetch;
    const evidence = await probeCharacterModuleRequest(
      "Failed to fetch dynamically imported module: " + url,
      "https://gtd-preview.example",
      request,
    );
    expect(evidence).toMatchObject({ attempted: true, status: 403, contentType: "text/html" });
    expect(request).toHaveBeenCalledWith(url, expect.objectContaining({
      method: "HEAD", credentials: "include", cache: "no-store",
    }));
  });
  it("records CORS/network failures without blocking the JSON evidence capture", async () => {
    const url = "https://gtd-preview.example/assets/gtd-runtime-DXWYBFon.js";
    const request = vi.fn(async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof fetch;
    const evidence = await probeCharacterModuleRequest(
      "Failed to fetch dynamically imported module: " + url,
      "https://gtd-preview.example",
      request,
    );
    expect(evidence).toMatchObject({ attempted: true, networkError: "TypeError: Failed to fetch" });
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
