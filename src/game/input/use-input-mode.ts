import { useEffect, useState } from 'react';
import type { InputMode } from '../core/types';
export function useInputMode() {
  const [mode, setMode] = useState<InputMode>('keyboard');
  useEffect(() => {
    if (matchMedia('(pointer: coarse)').matches) setMode('touch');
    const pointer = (event: PointerEvent) => setMode(event.pointerType === 'touch' ? 'touch' : 'keyboard');
    const keyboard = () => setMode('keyboard');
    const controller = () => setMode('controller');
    window.addEventListener('pointerdown', pointer); window.addEventListener('keydown', keyboard); window.addEventListener('gamepadconnected', controller);
    return () => { window.removeEventListener('pointerdown', pointer); window.removeEventListener('keydown', keyboard); window.removeEventListener('gamepadconnected', controller); };
  }, []);
  return mode;
}
