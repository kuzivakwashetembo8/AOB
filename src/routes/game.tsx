import { createFileRoute, redirect } from "@tanstack/react-router";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/game")({
  head: () =>
    pageHead(
      "South Ward retired",
      "South Ward is coming soon. North Heights is the only playable Meridian district.",
    ),
  // Legacy South Ward deep links must never bootstrap the retired runtime.
  beforeLoad: () => { throw redirect({ to: "/world", replace: true }); },
  component: () => null,
});
