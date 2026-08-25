import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface BackgroundAudioValue {
  playing: boolean;
  toggle: () => void;
}

const BackgroundAudioContext = createContext<BackgroundAudioValue | undefined>(undefined);

/**
 * Mounts the single persistent background-music <audio> element once at the App root (so it
 * keeps playing across every page/route change) and exposes play/pause state + a toggle to
 * anywhere in the tree — e.g. the 내 정보 settings page. Browsers block unmuted autoplay before
 * any user gesture on the page — the initial play() attempt covers browsers that allow it (e.g.
 * after a previous visit), and a one-time listener on the very first tap/click/key anywhere on
 * the page starts it for everyone else.
 */
export function BackgroundAudioProvider({ children }: { children: ReactNode }) {
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
    <BackgroundAudioContext.Provider value={{ playing, toggle }}>
      <audio ref={audioRef} src="/audio/bgm.mp3" loop playsInline />
      {children}
    </BackgroundAudioContext.Provider>
  );
}

export function useBackgroundAudio(): BackgroundAudioValue {
  const ctx = useContext(BackgroundAudioContext);
  if (!ctx) throw new Error('useBackgroundAudio must be used within BackgroundAudioProvider');
  return ctx;
}
