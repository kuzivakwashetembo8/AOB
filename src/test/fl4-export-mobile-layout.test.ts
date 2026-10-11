// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { mountFL4EvidenceExport } from "../game/debug/fl4-evidence-export";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("FL-4 mobile diagnostic export control", () => {
  it("mounts inside the game viewport instead of the standalone-PWA body height selector", () => {
    const viewport = document.createElement("main");
    viewport.className = "game-viewport";
    document.body.appendChild(viewport);
    const unmount = mountFL4EvidenceExport(
      () => { throw new Error("No diagnostics should be requested without clicking"); },
      () => null,
    );
    try {
      const button = viewport.querySelector<HTMLButtonElement>(
        '[data-gtd-fl4-export="true"]',
      );
      expect(button).not.toBeNull();
      expect(button?.parentElement).toBe(viewport);
      expect(button?.style.height).toBe("32px");
      expect(button?.style.maxHeight).toBe("32px");
      expect(button?.style.maxWidth).toBe("170px");
      expect(button?.style.position).toBe("fixed");
      expect(document.body.querySelector(":scope > button")).toBeNull();
    } finally {
      unmount();
    }
    expect(viewport.querySelector('[data-gtd-fl4-export="true"]')).toBeNull();
  });
});
