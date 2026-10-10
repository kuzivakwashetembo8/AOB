import { Link, useRouterState } from "@tanstack/react-router";
import { RotateCw, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import city from "@/assets/meridian-city.jpg";

export function Scene({ game = false }: { game?: boolean }) {
  return (
    <>
      <div className={`scene ${game ? "game-scene" : ""}`}>
        <img
          src={city}
          alt="Meridian City skyline overlooking the harbor, with Voight on a rooftop"
          width={1920}
          height={1088}
          fetchPriority="high"
        />
      </div>
      <div className="scene-edges" />
      {/* The menu grid is cosmetic; scanline styling must never overlay Babylon gameplay. */}
      {!game && <div className="scene-grid" />}
    </>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="GTD main menu">
      <span className="brand-symbol">
        GTD<span className="text-primary">.</span>
      </span>
      <span className="brand-name">
        GRAND THEFT
        <br />
        DIVISION
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
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <>
      <div className="landscape-app" key={path}>
        {children}
      </div>
      <div className="portrait-gate">
        <img src={city} alt="Meridian City at dusk" width={1920} height={1088} />
        <div className="portrait-content">
          <div className="portrait-mark">
            GTD<span className="text-primary">.</span>
          </div>
          <div className="system-label">GRAND THEFT DIVISION</div>
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
