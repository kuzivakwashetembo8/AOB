import { lazy, Suspense, useState } from "react";

const GameSession = lazy(() => import("@/ui/game-session"));

/** Root-owned canvas/engine lifetime. No engine is loaded before /game. */
export function PersistentGameSession({ active }: { active: boolean }) {
  const [visited, setVisited] = useState(active);
  if (active && !visited) setVisited(true);
  return (
    <div hidden={!active} style={active ? undefined : { display: "none" }}>
      {visited || active ? (
        <Suspense fallback={<div role="status">Opening Meridian…</div>}>
          <GameSession active={active} />
        </Suspense>
      ) : null}
    </div>
  );
}
