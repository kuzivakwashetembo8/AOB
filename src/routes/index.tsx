import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Play,
  Plus,
  Globe2,
  SlidersHorizontal,
  CarFront,
  Crosshair,
  Volume2,
  VolumeX,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/ui/menus/shell";
import { pageHead } from "@/lib/page-head";
import { useInputMode } from "@/game/input/use-input-mode";
import { InstallAction } from "@/ui/menus/install-action";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "Enter Meridian",
      "Enter P.O.I — Person of Interest. Explore Meridian City as Reese, uncover The Machine's leads and protect those at risk.",
    ),
  component: Launcher,
});
function Launcher() {
  const [selection, setSelection] = useState("A city worth protecting. A line worth holding.");
  const [muted, setMuted] = useState(true);
  const input = useInputMode();
  return (
    <PageShell>
      <section className="launcher-content">
        <div className="location-eyebrow">MERIDIA // MERIDIAN CITY</div>
        <h1 className="wordmark">
          P.O.I<span>.</span>
        </h1>
        <h2 className="game-title">PERSON OF INTEREST</h2>
        <div className="launcher-rule" />
        <p className="launcher-copy">
          Some cities need a hero.
          <br />
          This one needs you to hold the line.
        </p>
        <Button variant="game" asChild className="launcher-primary">
          <Link
            to="/world"
            onFocus={() => setSelection("Your city. Your responsibility.")}
            onMouseEnter={() => setSelection("Your city. Your responsibility.")}
          >
            ENTER MERIDIAN <ArrowRight size={18} />
          </Link>
        </Button>
        <InstallAction placement="launcher" />
        <div className="launcher-menu">
          <div className="menu-entry">
            <Button
              variant="menu"
              disabled
              title="Continue — Coming soon until a durable save system is available"
            >
              <Play size={14} /> Continue <span className="menu-shortcut">COMING SOON</span>
            </Button>
          </div>
          <div className="menu-entry">
            <Button variant="menu" asChild>
              <Link
                to="/world"
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
            <Button variant="menu" asChild>
              <Link to="/vehicles" onFocus={() => setSelection("Inspect extracted vehicle geometry.")}>
                <CarFront size={14} /> Cars <ChevronRight size={13} />
              </Link>
            </Button>
          </div>
          <div className="menu-entry">
            <Button variant="menu" asChild>
              <Link to="/guns" onFocus={() => setSelection("Inspect the extracted LMS weapon models.")}>
                <Crosshair size={14} /> Guns <ChevronRight size={13} />
              </Link>
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

    </PageShell>
  );
}
