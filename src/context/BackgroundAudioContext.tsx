import { createContext, type ReactNode, useContext, useRef, useState } from 'react';

interface BackgroundAudioValue {
  playing: boolean;
  toggle: () => void;
}

const BackgroundAudioContext = createContext<BackgroundAudioValue | undefined>(undefined);

/**
 * Mounts the single persistent background-music <audio> element once at the App root (so it
 * keeps playing across every page/route change) and exposes play/pause state + a toggle to
 * anywhere in the tree — e.g. the 내 정보 settings page. Off by default; only starts once the
 * player explicitly turns it on.
 */
export function BackgroundAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

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
