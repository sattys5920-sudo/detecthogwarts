import { useEffect, useRef } from 'react';

/** How close to the bottom (in px) still counts as "at the bottom" for auto-scroll purposes. */
const NEAR_BOTTOM_PX = 80;

/**
 * Ref for a scrolling message list that auto-scrolls to the bottom when `dep` changes (typically
 * `messages.length`) — but only if the user was already near the bottom. Someone scrolled up reading
 * older messages stays put even as new ones arrive, instead of being yanked back down.
 */
export function useStickyScroll<T extends HTMLElement>(dep: unknown) {
  const ref = useRef<T>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (nearBottomRef.current) {
      ref.current?.scrollTo({ top: ref.current.scrollHeight });
    }
  }, [dep]);

  return ref;
}
