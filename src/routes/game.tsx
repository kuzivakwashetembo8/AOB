import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/game")({
  head: () =>
    pageHead(
      "Meridian viewport",
      "The GTD game viewport: mission objectives, contextual HUD, touch controls, and a clean future 3D runtime boundary.",
    ),
  // The root owns the live game surface so navigation cannot destroy it.
  component: () => null,
});
