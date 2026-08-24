import { useEffect, useRef, useState } from 'react';
import NibIcon from './NibIcon';

interface ComposerProps {
  onSubmit: (text: string) => void;
  placeholder: string;
  submitLabel: string;
}

export default function Composer({ onSubmit, placeholder, submitLabel }: ComposerProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function scrollComposerIntoView() {
    const wrap = wrapRef.current;
    const main = wrap?.closest('main');
    if (!wrap || !main) return;
    // scrollIntoView() on a `sticky` element (or a marker next to one) is unreliable — it reads
    // the element's stuck/adjusted position and often treats it as already visible even when the
    // scroll container hasn't actually scrolled there. Computing the offset by hand and nudging
    // scrollTop directly works regardless of how the sticky positioning is resolved.
    const overflow = wrap.getBoundingClientRect().bottom - main.getBoundingClientRect().bottom;
    if (overflow > 0) main.scrollTop += overflow;
  }

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    // The keyboard finishes animating in slightly after focus fires, which is when the on-screen
    // keyboard actually shrinks the visible area — if the page content was taller than the shrunk
    // space, the scroll container stays wherever it was (usually the top), leaving this composer
    // below the fold. Once the resize settles, pull it (and the chat just above it) into view.
    const onViewportResize = () => {
      if (document.activeElement !== inputRef.current) return;
      // AppShell resizes off this same event, via a React state update that hasn't reached the
      // DOM yet at this point in the dispatch — scrolling now would still measure the old,
      // unshrunk layout. Wait a frame so the shrink has actually been painted first.
      requestAnimationFrame(scrollComposerIntoView);
    };
    vv.addEventListener('resize', onViewportResize);
    return () => vv.removeEventListener('resize', onViewportResize);
  }, []);

  function submit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
    // Tapping the send button moves focus off the input, which dismisses the mobile keyboard —
    // re-focus right after sending so the keyboard stays up for the next message, and only
    // closes when the user actually taps away.
    inputRef.current?.focus();
  }

  return (
    <div
      ref={wrapRef}
      className="sticky bottom-0 z-10 flex items-center gap-2 bg-paper-50 py-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <input
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        onFocus={scrollComposerIntoView}
        placeholder={placeholder}
        className="min-w-0 flex-1 rounded-sm border border-ink-700/30 bg-paper-50 px-3.5 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-500/40 focus:border-seal-500"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!text.trim()}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-seal-700 bg-seal-600 text-paper-50 disabled:opacity-40"
        aria-label={submitLabel}
      >
        <NibIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
