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

  function scrollToBottom() {
    const main = wrapRef.current?.closest('main');
    if (main) main.scrollTop = main.scrollHeight;
  }

  function handleFocus() {
    // Exactly when the on-screen keyboard finishes animating in (and the scroll container's
    // clientHeight actually reflects the shrunk space) varies across browsers/devices — retrying
    // a few times over the first ~350ms is far more reliable than chasing one precise event. Each
    // call is a cheap no-op once already scrolled to the bottom.
    scrollToBottom();
    requestAnimationFrame(scrollToBottom);
    [50, 150, 350].forEach((delay) => setTimeout(scrollToBottom, delay));
  }

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onViewportChange = () => {
      if (document.activeElement === inputRef.current) scrollToBottom();
    };
    vv.addEventListener('resize', onViewportChange);
    vv.addEventListener('scroll', onViewportChange);
    return () => {
      vv.removeEventListener('resize', onViewportChange);
      vv.removeEventListener('scroll', onViewportChange);
    };
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
        onFocus={handleFocus}
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
