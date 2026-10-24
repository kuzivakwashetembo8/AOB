import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RuntimeBridge } from "./runtime-bridge";

const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** A pause is latched until the player explicitly resumes the same session. */
export function useSessionPause(bridge: RuntimeBridge, active: boolean) {
  const [requested, setRequested] = useState(false);
  const pauseRequested = useRef(false);
  const activeRef = useRef(active);

  const setPaused = useCallback((next: boolean | ((old: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(pauseRequested.current) : next;
    if (!value && (!activeRef.current || document.hidden)) return;
    pauseRequested.current = value;
    if (value) bridge.pause();
    else bridge.resume();
    setRequested(value);
  }, [bridge]);

  useClientLayoutEffect(() => {
    activeRef.current = active;
    if (!active) setPaused(true);
  }, [active, setPaused]);

  useEffect(() => {
    const suspend = () => setPaused(true);
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener("blur", suspend);
    window.addEventListener("pagehide", suspend);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("freeze", suspend);
    visibility();
    // No focus/pageshow/visibility handler resumes: returning is not consent
    // to advance the simulation, particularly when the player was driving.
    return () => {
      window.removeEventListener("blur", suspend);
      window.removeEventListener("pagehide", suspend);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("freeze", suspend);
    };
  }, [setPaused]);

  const startRuntime = useCallback(() => {
    // Bootstrap can complete after an app/tab switch or GTD route exit.
    // Pause a ready runtime before scheduling even one simulation frame.
    if (pauseRequested.current || !activeRef.current || document.hidden) setPaused(true);
    else bridge.start();
  }, [bridge, setPaused]);

  return { paused: requested || !active, setPaused, startRuntime };
}
