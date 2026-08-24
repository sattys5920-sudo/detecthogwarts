import { useEffect, useState } from 'react';

/**
 * Tracks the browser's visual viewport height in px. On mobile, 100vh/100dvh often stay pinned
 * to the full un-shrunk layout height even after an on-screen keyboard opens, which is what lets
 * a fixed-height app shell end up with its bottom-docked content (composer inputs, the tab bar)
 * hidden behind the keyboard. The Visual Viewport API's height does shrink with the keyboard, so
 * using it to size the shell keeps everything above it visible. Falls back to window.innerHeight
 * when the API isn't available.
 */
export function useViewportHeight(): number {
  const [height, setHeight] = useState(() =>
    typeof window === 'undefined' ? 0 : (window.visualViewport?.height ?? window.innerHeight),
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setHeight(vv.height);
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return height;
}
