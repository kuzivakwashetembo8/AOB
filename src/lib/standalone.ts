import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** True when the shell runs as an installed app (standalone/fullscreen or iOS home screen). */
export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    ["standalone", "fullscreen", "minimal-ui"].some(
      (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
    )
  );
}

/** Reactive display-mode state; false during SSR and first paint. */
export function useStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const update = () => {
      const value = isStandaloneDisplay();
      setStandalone(value);
      document.documentElement.dataset["display"] = value ? "standalone" : "browser";
    };
    update();
    const queries = ["standalone", "fullscreen"].map((m) =>
      window.matchMedia(`(display-mode: ${m})`),
    );
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, []);
  return standalone;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let captureStarted = false;

/** Capture beforeinstallprompt once, as early as possible, without showing anything. */
export function captureInstallPrompt() {
  if (captureStarted || typeof window === "undefined") return;
  captureStarted = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

export type InstallAvailability = "unavailable" | "prompt" | "ios";

/** Install affordance state: native prompt, iOS share-sheet hint, or hidden. */
export function useInstallPrompt() {
  const standalone = useStandalone();
  const [, force] = useState(0);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    captureInstallPrompt();
    const l = () => force((n) => n + 1);
    listeners.add(l);
    const ua = navigator.userAgent;
    const iosDevice =
      /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    setIos(iosDevice && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua));
    return () => {
      listeners.delete(l);
    };
  }, []);
  const availability: InstallAvailability = standalone
    ? "unavailable"
    : deferred
      ? "prompt"
      : ios
        ? "ios"
        : "unavailable";
  const install = async () => {
    if (!deferred) return false;
    const event = deferred;
    deferred = null;
    await event.prompt();
    const choice = await event.userChoice;
    listeners.forEach((l) => l());
    return choice.outcome === "accepted";
  };
  return { availability, install, standalone };
}
