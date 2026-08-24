import { useEffect, useState } from 'react';

interface ViewportMetrics {
  height: number;
  offsetTop: number;
}

function readMetrics(): ViewportMetrics {
  const vv = typeof window === 'undefined' ? undefined : window.visualViewport;
  return {
    height: vv?.height ?? (typeof window === 'undefined' ? 0 : window.innerHeight),
    offsetTop: vv?.offsetTop ?? 0,
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
 */
export function useViewportHeight(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() =>
    typeof window === 'undefined' ? { height: 0, offsetTop: 0 } : readMetrics(),
  );

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
