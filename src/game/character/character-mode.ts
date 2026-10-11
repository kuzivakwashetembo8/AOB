/**
 * GTD-CHAR-001 release activation. Keep this module dependency-free so
 * gameplay UI and runtime never disagree about which character is active.
 *
 * The UAL asset is still provisional; enabling the playable rig on production
 * for device confirmation does NOT approve it as final Voight artwork.
 */
const MAIN_HOSTS = new Set([
  "grand-theft-division.vercel.app",
  "gtd-interlinkglobaltech.vercel.app",
  "gtd-git-main-interlinkglobaltech.vercel.app",
]);

export function isMeridiaCharacterTrialRequested(search: string, hostname: string): boolean {
  const mode = new URLSearchParams(search).get("gtdCharacterTrial");
  // Explicit rollback never changes physics or game logic on the server.
  if (mode === "baseline" || mode === "off") return false;
  if (mode === "ual") return true;
  // A production merge must be visible at the URL gamers actually open;
  // ordinary branch previews remain opt-in.
  return MAIN_HOSTS.has(hostname.toLowerCase());
}
