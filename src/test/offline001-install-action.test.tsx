// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InstallAction } from "../ui/menus/install-action";

describe("OFFLINE-001 install action", () => {
  it("has a prominent install control before game startup even without a browser prompt", () => {
    const view = render(<InstallAction placement="launcher" />);
    const button = screen.getByRole("button", { name: /Install G\.T\.D application/i });
    expect(button).toBeVisible();
    expect(button.className).toContain("install-button");
    expect(button.textContent).toContain("INSTALL G.T.D");
    expect(screen.getByText(/Complete offline resources come in a later update/i)).toBeVisible();
    fireEvent.click(button);
    expect(screen.getByRole("status").textContent).toMatch(/browser menu/i);
    view.unmount();
  });

  it("renders the installation affordance in Settings", () => {
    const view = render(<InstallAction placement="settings" />);
    expect(screen.getByRole("button", { name: /Install G\.T\.D application/i })).toBeVisible();
    expect(view.container.querySelector(".install-action--settings")).toBeTruthy();
    view.unmount();
  });
});
