import { useEffect, useRef, useState } from 'react';

/**
 * A small persistent background-music player that autoplays and loops as soon as the site
 * loads, mounted once at the App root so it keeps playing across every page/route change.
 * Browsers block unmuted autoplay before any user gesture on the page — the initial play()
 * attempt covers browsers that allow it (e.g. after a previous visit), and a one-time listener
 * on the very first tap/click/key anywhere on the page starts it for everyone else.
 */
export default function SiteBackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const events: (keyof DocumentEventMap)[] = ['pointerdown', 'keydown'];
    const startOnGesture = () => {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    };

    audio
      .play()
      .then(() => setPlaying(true))
      // Autoplay blocked — fall back to starting on the first user interaction anywhere on the page.
      .catch(() => events.forEach((evt) => document.addEventListener(evt, startOnGesture, { once: true })));

    return () => events.forEach((evt) => document.removeEventListener(evt, startOnGesture));
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <div className="fixed top-3 right-3 z-40">
      <audio ref={audioRef} src="/audio/bgm.mp3" loop playsInline />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? '배경 음악 일시정지' : '배경 음악 재생'}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-700/30 bg-ink-black/70 text-paper-50 shadow-lg transition-colors hover:bg-ink-black/85"
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <rect x="2" y="1" width="4" height="12" rx="1" />
            <rect x="8" y="1" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <path d="M2.5 1.2 12 7 2.5 12.8Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
