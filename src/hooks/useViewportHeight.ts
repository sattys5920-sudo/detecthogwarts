import { useEffect, useState } from 'react';

interface ViewportMetrics {
  height: number;
  offsetTop: number;
  keyboardOpen: boolean;
}

// A collapsing mobile browser toolbar (URL bar) shrinks window.innerHeight by roughly 50-100px;
// an on-screen keyboard shrinks visualViewport.height by 250px+. This sits safely between the two,
// so scrolling doesn't false-positive as "keyboard open".
const KEYBOARD_HEIGHT_THRESHOLD = 150;

function readMetrics(): ViewportMetrics {
  if (typeof window === 'undefined') return { height: 0, offsetTop: 0, keyboardOpen: false };
  const vv = window.visualViewport;
  const height = vv?.height ?? window.innerHeight;
  return {
    height,
    offsetTop: vv?.offsetTop ?? 0,
    keyboardOpen: window.innerHeight - height > KEYBOARD_HEIGHT_THRESHOLD,
  };
}

/**
 * Tracks the browser's visual viewport size/position. On mobile, 100vh/100dvh often stay pinned
 * to the full un-shrunk layout height even after an on-screen keyboard opens, which is what lets
 * a fixed-height app shell end up with its bottom-docked content (composer inputs, the tab bar)
 * hidden behind the keyboard. The Visual Viewport API's height does shrink with the keyboard, so
 * using it to size the shell keeps everything above it visible.
 *
 * offsetTop matters too: when a text input is focused, mobile Safari scrolls the underlying layout
 * viewport to bring it into view, which shifts where the visual viewport sits within that layout
 * viewport. A `position: fixed` shell pinned to `top: 0` doesn't follow that shift, so the visible
 * slice of the app ends up showing the wrong portion of the page (e.g. the tab bar instead of the
 * composer). Tracking offsetTop and applying it as the shell's `top` keeps the shell aligned with
 * whatever is actually on screen.
 *
 * keyboardOpen flags when the shrink is large enough to be a keyboard rather than browser-chrome
 * collapse, so the bottom tab bar can be hidden while typing — otherwise it eats into the
 * already-shrunk space and leaves the composer sitting a gap above the keyboard instead of flush
 * against it.
 */
export function useViewportHeight(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() => readMetrics());

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setMetrics(readMetrics());
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return metrics;
}
