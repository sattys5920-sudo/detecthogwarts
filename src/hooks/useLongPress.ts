import { useRef, type MouseEvent, type TouchEvent } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_CANCEL_PX = 10;

/** Long-press (touch) or right-click (mouse) to trigger an action, e.g. opening a context modal. */
export function useLongPress(onTrigger: () => void) {
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function clear() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }

  function onTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = window.setTimeout(() => {
      onTrigger();
      clear();
    }, LONG_PRESS_MS);
  }

  function onTouchMove(e: TouchEvent) {
    if (!startRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startRef.current.x);
    const dy = Math.abs(touch.clientY - startRef.current.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) clear();
  }

  function onContextMenu(e: MouseEvent) {
    e.preventDefault();
    onTrigger();
  }

  return { onTouchStart, onTouchEnd: clear, onTouchCancel: clear, onTouchMove, onContextMenu };
}
