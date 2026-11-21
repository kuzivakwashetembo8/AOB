import { Link } from "@tanstack/react-router";
import { RotateCw, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import city from "@/assets/meridian-city.jpg";

export function Scene({ game = false }: { game?: boolean }) {
  if (game) {
    // MA-FM-07: Gameplay must never mount the launcher hero photograph behind
    // the WebGL canvas. Opaque fallback protects render/texture failures from
    // displaying unrelated site artwork as apparent world geometry.
    return <div className="scene game-scene" aria-hidden="true" />;
  }
  return (
    <>
      <div className="scene">
        <img
          src={city}
          alt="Meridian City skyline overlooking the harbor, with Reese on a rooftop"
          width={1920}
          height={1088}
          fetchPriority="high"
        />
      </div>
      <div className="scene-edges" />
      <div className="scene-grid" />
    </>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Age of Abundance main menu">
      <span className="brand-symbol">
        AOB<span className="text-primary">.</span>
      </span>
      <span className="brand-name">
        AGE OF
        <br />
        ABUNDANCE
      </span>
    </Link>
  );
}
export function ShellHeader() {
  return (
    <header className="shell-header">
      <div className="min-w-0">
        <Brand />
      </div>
      <nav className="header-nav" aria-label="Main navigation">
        <Link to="/" className="nav-link" activeOptions={{ exact: true }}>
          LAUNCHER
        </Link>
        <Link to="/world" className="nav-link">
          WORLD
        </Link>
        <Link to="/settings" className="nav-link">
          SETTINGS
        </Link>
        <span className="build-tag">
          <span className="status-dot" /> DEVELOPMENT BUILD
        </span>
      </nav>
    </header>
  );
}
export function LandscapeBoundary({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="landscape-app">{children}</div>
      <div className="portrait-gate">
        <img src={city} alt="Meridian City at dusk" width={1920} height={1088} />
        <div className="portrait-content">
          <div className="portrait-mark">
            AOB<span className="text-primary">.</span>
          </div>
          <div className="system-label">AGE OF ABUNDANCE</div>
          <RotateCw size={36} className="rotate-icon" />
          <h1>ROTATE DEVICE TO CONTINUE</h1>
          <p>Meridian deserves a wider view.</p>
          <div className="system-label mt-10">
            MERIDIA // MERIDIAN CITY
            <br />
            BUILD 0.1.0
          </div>
        </div>
      </div>
    </>
  );
}
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="game-shell">
      <Scene />
      <ShellHeader />
      {children}
    </main>
  );
}
export function BackLink() {
  return (
    <Link to="/" className="back-link">
      <ArrowLeft size={14} /> MAIN MENU
    </Link>
  );
}
