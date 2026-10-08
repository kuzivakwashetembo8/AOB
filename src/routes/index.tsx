import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Play,
  Plus,
  Globe2,
  SlidersHorizontal,
  Terminal,
  Volume2,
  VolumeX,
  ChevronRight,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useModalFocus } from "@/ui/menus/use-modal-focus";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/ui/menus/shell";
import { pageHead } from "@/lib/page-head";
import { useInputMode } from "@/game/input/use-input-mode";
import { InstallAction } from "@/ui/menus/install-action";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Enter Meridian",
      "Enter the world of GTD — Grand Theft Division. Meridian City awaits Voight in an original, protector-led urban action game.",
    ),
  component: Launcher,
});
function Launcher() {
  const [selection, setSelection] = useState("A city worth protecting. A line worth holding.");
  const [development, setDevelopment] = useState(false);
  const [muted, setMuted] = useState(true);
  const input = useInputMode();
  const closeDevelopment = useCallback(() => setDevelopment(false), []);
  useModalFocus(development, closeDevelopment);
  return (
    <PageShell>
      <section className="launcher-content">
        <div className="location-eyebrow">MERIDIA // MERIDIAN CITY</div>
        <h1 className="wordmark">
          GTD<span>.</span>
        </h1>
        <h2 className="game-title">GRAND THEFT DIVISION</h2>
        <div className="launcher-rule" />
        <p className="launcher-copy">
          Some cities need a hero.
          <br />
          This one needs you to hold the line.
        </p>
        <Button variant="game" asChild className="launcher-primary">
          <Link
            to="/game"
            onFocus={() => setSelection("Your city. Your responsibility.")}
            onMouseEnter={() => setSelection("Your city. Your responsibility.")}
          >
            ENTER MERIDIAN <ArrowRight size={18} />
          </Link>
        </Button>
        <div className="launcher-menu">
          <div className="menu-entry">
            <Button
              variant="menu"
              disabled
              title="Available when a game runtime provides save data"
            >
              <Play size={14} /> Continue <span className="menu-shortcut">NO SAVE</span>
            </Button>
          </div>
          <div className="menu-entry">
            <Button variant="menu" asChild>
              <Link
                to="/game"
                onFocus={() => setSelection("Every protector starts somewhere.")}
                onMouseEnter={() => setSelection("Every protector starts somewhere.")}
              >
                <Plus size={14} /> New Game <ChevronRight size={13} />
              </Link>
            </Button>
          </div>
          <div className="menu-entry">
            <Button variant="menu" asChild>
              <Link
                to="/world"
                onFocus={() => setSelection("Twelve districts. One city to protect.")}
                onMouseEnter={() => setSelection("Twelve districts. One city to protect.")}
              >
                <Globe2 size={14} /> World <ChevronRight size={13} />
              </Link>
            </Button>
          </div>
          <div className="menu-entry">
            <Button variant="menu" asChild>
              <Link to="/settings">
                <SlidersHorizontal size={14} /> Settings <ChevronRight size={13} />
              </Link>
            </Button>
          </div>
          <div className="menu-entry">
            <Button variant="menu" onClick={() => setDevelopment(true)}>
              <Terminal size={14} /> Development Build <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      </section>
      <aside className="launcher-caption">
        <div className="system-label">ONE CITY. ONE LINE TO HOLD.</div>
        <div className="name mt-2">VOIGHT</div>
        <div className="line" />
      </aside>
      <footer className="launcher-footer">
        <div className="footer-status">
          <div className="footer-item">
            <span className="system-label">WORLD STATE</span>
            <span className="footer-value">
              <span className="status-dot" /> READY
            </span>
          </div>
          <div className="footer-item">
            <span className="system-label">CURRENT LOCATION</span>
            <span className="footer-value">MERIDIAN CENTRAL</span>
          </div>
          <div className="footer-item">
            <span className="system-label">INPUT DETECTED</span>
            <span className="footer-value">
              {input === "touch"
                ? "TOUCH"
                : input === "controller"
                  ? "CONTROLLER"
                  : "KEYBOARD + CONTROLLER"}
            </span>
          </div>
        </div>
        <div className="footer-end">
          <span className="footer-note">
            BUILD 0.1.0 <span className="text-primary">//</span> PRE-ALPHA
          </span>
          <InstallAction />
          <Button
            variant="control"
            className="sound-button"
            aria-label={muted ? "Enable shell audio preference" : "Mute shell audio preference"}
            title="Audio preference — soundtrack not yet connected"
            onClick={() => setMuted(!muted)}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </Button>
        </div>
      </footer>
      <div className="bottom-bar">
        <span>
          {input === "touch" ? (
            "MERIDIAN IS WAITING"
          ) : (
            <>
              <span className="key">↵</span> SELECT{" "}
              <span className="ml-5">
                <span className="key">TAB</span> NAVIGATE
              </span>
            </>
          )}
        </span>
        <span aria-live="polite">{selection}</span>
        <span>AN ORIGINAL WORLD.</span>
      </div>
      {development && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Development build">
          <div className="overlay-content">
            <div className="flex justify-between items-center">
              <span className="system-label text-primary">GTD // BUILD 0.1.0</span>
              <Button
                autoFocus
                variant="control"
                aria-label="Close development details"
                onClick={() => setDevelopment(false)}
              >
                <X />
              </Button>
            </div>
            <h2 className="overlay-title">FOUNDATION BUILD</h2>
            <div className="diagnostics">
              <span>UI SYSTEM</span>
              <span className="text-system">READY</span>
              <span>RUNTIME BRIDGE</span>
              <span className="text-system">READY</span>
              <span>3D ENGINE</span>
              <span>NOT ATTACHED</span>
              <span>SAVE SYSTEM</span>
              <span>NOT ATTACHED</span>
            </div>
            <p className="overlay-note">
              Meridian City · Meridia
              <br />
              Voight · Protector progression
              <br />
              Original world. Independent identity.
            </p>
            <Button variant="game" onClick={() => setDevelopment(false)}>
              RETURN TO LAUNCHER <ArrowRight />
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
