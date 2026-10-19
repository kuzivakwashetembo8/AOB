// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/offline-game", () => ({
  getOfflineProgress: () => ({ phase: "idle", done: 0, total: 0, bytesDone: 0, bytesTotal: 0, message: "", categories: [] }),
  subscribeOfflineProgress: () => () => {},
  inspectOfflineReadiness: async () => {},
  startOfflineDownload: vi.fn(async () => {}),
}));
import { fireEvent, render, screen } from "@testing-library/react";
import { InstallAction } from "../ui/menus/install-action";

describe("OFFLINE-001 install action", () => {
  it("has a prominent install control before game startup even without a browser prompt", () => {
    const view = render(<InstallAction placement="launcher" />);
    const button = screen.getByRole("button", { name: /Install G\.T\.D application/i });
    expect(button).toBeVisible();
    expect(button.className).toContain("install-button");
    expect(button.textContent).toContain("INSTALL G.T.D");
    expect(screen.getByText(/Keep GTD open and Wi-Fi connected/i)).toBeVisible();
    fireEvent.click(button);
    expect(screen.getByRole("status").textContent).toMatch(/browser menu/i);
    view.unmount();
  });

  it("renders the installation affordance in Settings", () => {
    const view = render(<InstallAction placement="settings" />);
    expect(screen.getByRole("button", { name: /Install G\.T\.D application/i })).toBeVisible();
    expect(view.container.querySelector(".install-action--settings")).toBeTruthy();
    expect(screen.getByRole("region", { name: /G.T.D installation checklist/i })).toBeVisible();
    expect(screen.getByText("GAME INSTALLATION")).toBeVisible();
    expect(screen.getByText("Vehicle models")).toBeVisible();
    expect(screen.getByText("Play without Wi-Fi")).toBeVisible();
    view.unmount();
  });
});
