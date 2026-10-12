/** MAT-003 acceptance: one local WebP image surface on the exact configured
 * apartment and garage. Enabled by default for gameplay after owner approval.
 * The zero value is a field-diagnostic opt-out, not a production prerequisite.
 */
export function acceptedBrickSurfaceEnabled(params: URLSearchParams): boolean {
  return params.get("gtdBrickTrial") !== "0";
}
