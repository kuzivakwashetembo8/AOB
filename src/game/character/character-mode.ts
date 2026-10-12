/**
 * GTD-CHAR-001 protagonist precedence.
 *
 * The working rigged humanoid is the only supported playable character on
 * main, preview branches and local development until a successor is accepted.
 * Preserve this compatibility entry point for the existing game UI/runtime.
 * Historical ?gtdCharacterTrial=baseline/off flags cannot silently restore
 * the obsolete capsule. Asset/animation load failure must surface as failure.
 *
 * This provisional UAL model is accepted for development locomotion, NOT
 * approved as the eventual original character or for commercial licensing.
 */
export function isMeridiaCharacterTrialRequested(_search: string, _hostname: string): boolean {
  return true;
}
