import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BackLink, PageShell } from "@/ui/menus/shell";
import { pageHead } from "@/lib/page-head";
import { districts } from "@/game/world/districts";
export const Route = createFileRoute("/world")({
  head: () =>
    pageHead(
      "Meridian City",
      "Discover the twelve districts of Meridian City, from the working harbor to the streets of Old Meridian.",
    ),
  component: World,
});
function World() {
  const [selected, setSelected] = useState(0);
  const district = districts[selected] ?? districts[0];
  return (
    <PageShell>
      <section className="page-content">
        <div className="page-top">
          <div className="min-w-0">
            <div className="system-label text-primary">MERIDIA // WORLD DIRECTORY</div>
            <h1 className="page-heading">
              MERIDIAN CITY<span className="text-primary">.</span>
            </h1>
            <p className="page-subtitle">
              Twelve districts. Countless stories. One city worth protecting.
            </p>
          </div>
          <BackLink />
        </div>
        <div className="world-layout">
          <nav className="district-list" aria-label="Meridian districts">
            {districts.map((item, index) => (
              <Button
                key={item.code}
                variant="menu"
                className="district-button"
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
                onFocus={() => setSelected(index)}
              >
                <span className="district-code">{item.code}</span>
                {item.name}
                {selected === index && <ArrowRight className="ml-auto" size={13} />}
              </Button>
            ))}
          </nav>
          <article className="district-detail" key={district.code}>
            <div className="location-eyebrow">
              <MapPin size={12} /> SECTOR {district.code} // {district.sector}
            </div>
            <h2>{district.name}</h2>
            <div className="system-label text-primary">{district.identity}</div>
            <p>{district.description}</p>
            <div className="district-meta">
              <div>
                <span className="system-label">ENVIRONMENT</span>
                <strong>{district.terrain}</strong>
              </div>
              <div>
                <span className="system-label">LANDMARK</span>
                <strong>{district.landmark}</strong>
              </div>
            </div>
            <Button variant="game" asChild className="mt-8 w-64">
              <Link to="/game">
                ENTER MERIDIAN <ArrowRight />
              </Link>
            </Button>
            <div className="system-label mt-5">DISTRICT PROFILE // WORLD PREVIEW</div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
