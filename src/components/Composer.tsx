import { useEffect, useRef, useState } from 'react';
import { listenAllPlayers } from '../firebase/players';
import NibIcon from './NibIcon';

interface ComposerProps {
  onSubmit: (text: string) => void;
  placeholder: string;
  submitLabel: string;
}

const EVERYONE_TAG = '전체';
const ADMIN_USERNAME = 'admin';
/** 16px (the iOS zoom-guard floor) scaled down to ~14px of visible text — see the input's own comment below. */
const COMPOSER_INPUT_SCALE = 0.875;

/** Finds the "@fragment" the caret is currently inside of, if any — null when the caret isn't mid-mention. */
function activeMentionQuery(text: string, caret: number): { start: number; query: string } | null {
  const uptoCaret = text.slice(0, caret);
  const at = uptoCaret.lastIndexOf('@');
  if (at === -1) return null;
  const fragment = uptoCaret.slice(at + 1);
  if (/\s/.test(fragment)) return null;
  return { start: at, query: fragment };
}

export default function Composer({ onSubmit, placeholder, submitLabel }: ComposerProps) {
  const [text, setText] = useState('');
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // A plain (non-sticky) marker placed right before the composer in normal flow. Its
  // getBoundingClientRect() always reflects the composer's true position, unlike the composer's
  // own rect (which is `position: sticky` and can misreport once already stuck) or scrollTop =
  // scrollHeight (which overshoots past the composer whenever something follows it in the page,
  // e.g. the admin GM console rendered below the chat on some pages).
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      listenAllPlayers((players) => {
        const names = players
          .filter((p) => p.username !== ADMIN_USERNAME && p.nickname)
          .map((p) => p.nickname)
          .sort((a, b) => a.localeCompare(b, 'ko'));
        setNicknames([...new Set(names)]);
      }),
    [],
  );

  const suggestions = mention
    ? [EVERYONE_TAG, ...nicknames]
        .filter((n) => n !== EVERYONE_TAG || EVERYONE_TAG.includes(mention.query) || '모두'.includes(mention.query))
        .filter((n, i, arr) => arr.indexOf(n) === i)
        .filter((n) => n.toLowerCase().includes(mention.query.toLowerCase()))
        .slice(0, 6)
    : [];

  function scrollToBottom() {
    const marker = markerRef.current;
    const main = marker?.closest('main');
    if (!marker || !main) return;
    const delta = marker.getBoundingClientRect().bottom - main.getBoundingClientRect().bottom;
    main.scrollTop += delta;
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setText(value);
    setMention(activeMentionQuery(value, e.target.selectionStart ?? value.length));
  }

  function pickMention(name: string) {
    if (!mention) return;
    const before = text.slice(0, mention.start);
    const after = text.slice(mention.start + 1 + mention.query.length);
    const next = `${before}@${name} ${after}`;
    setText(next);
    setMention(null);
    const caret = before.length + name.length + 2;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(caret, caret);
    });
  }

  function submit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
    setMention(null);
    // Tapping the send button moves focus off the input, which dismisses the mobile keyboard —
    // re-focus right after sending so the keyboard stays up for the next message, and only
    // closes when the user actually taps away.
    inputRef.current?.focus();
  }

  return (
    <>
      <div ref={markerRef} aria-hidden="true" />
      <div
        className="sticky bottom-0 z-10 flex flex-col gap-1 bg-paper-50 py-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {mention && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 rounded-sm border border-ink-700/15 bg-paper-100 px-2 py-1.5">
            {suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickMention(name)}
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  name === EVERYONE_TAG ? 'border-seal-600 bg-seal-600/10 text-seal-600' : 'border-ink-700/25 bg-paper-50 text-ink-700'
                }`}
              >
                @{name}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          {/*
            The <input> itself must keep computed font-size >= 16px, or iOS Safari auto-zooms the
            whole page on focus (see the global `input, textarea, select { font-size: 16px }` rule
            in index.css). To still show smaller-looking text, the input is laid out oversized
            (1 / COMPOSER_INPUT_SCALE of the wrapper) and then visually scaled down — iOS only reads
            the computed font-size (unaffected by transform), so the zoom guard still holds, while
            the rendered glyphs end up the target visual size.
          */}
          <div className="relative h-9 min-w-0 flex-1 overflow-hidden rounded-sm border border-ink-700/30 bg-paper-50 focus-within:border-seal-500">
            <input
              ref={inputRef}
              value={text}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              onFocus={handleFocus}
              placeholder={placeholder}
              style={{
                width: `${100 / COMPOSER_INPUT_SCALE}%`,
                height: `${100 / COMPOSER_INPUT_SCALE}%`,
                transform: `scale(${COMPOSER_INPUT_SCALE})`,
                transformOrigin: 'top left',
              }}
              className="absolute top-0 left-0 bg-transparent px-3.5 py-2 text-ink-900 outline-none placeholder:text-ink-500/40"
            />
          </div>
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
      </div>
    </>
  );
}
