import { type ReactNode, useEffect, useState } from 'react';
import Envelope from './Envelope';
import OwlSilhouette from './OwlSilhouette';

const SEEN_KEY = 'arcanum-owl-intro-seen';

type Phase = 'flying' | 'landed' | 'opening' | 'opened';

export default function OwlIntro({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('flying');
  const [showOwl, setShowOwl] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadySeen = localStorage.getItem(SEEN_KEY) === 'true';
    if (reduced || alreadySeen) {
      setShowOwl(false);
      setPhase('landed');
    }
  }, []);

  function handleEnvelopeLanded() {
    localStorage.setItem(SEEN_KEY, 'true');
    setPhase('landed');
  }

  function handleOpen() {
    setPhase('opening');
    window.setTimeout(() => setPhase('opened'), 750);
  }

  if (phase === 'opened') {
    return <div className="w-full max-w-xs animate-[fadeIn_0.4s_ease-out]">{children}</div>;
  }

  return (
    <div className="relative flex h-64 w-full max-w-xs items-center justify-center">
      {phase === 'flying' && (
        <Envelope
          open={false}
          className="animate-envelope-carry absolute w-16"
          onAnimationEnd={(e) => {
            if (e.animationName === 'envelopeBounce') handleEnvelopeLanded();
          }}
        />
      )}
      {showOwl && phase === 'flying' && (
        <OwlSilhouette className="animate-owl-flight absolute h-20 w-24" onAnimationEnd={() => setShowOwl(false)} />
      )}
      {(phase === 'landed' || phase === 'opening') && (
        <button type="button" onClick={handleOpen} className="group flex flex-col items-center gap-3">
          <Envelope open={phase === 'opening'} className="w-28 drop-shadow-md" />
          {phase === 'landed' && (
            <p className="animate-pulse font-serif-kr text-xs text-ink-700/60">
              편지 봉투를 눌러 열어보세요
            </p>
          )}
        </button>
      )}
    </div>
  );
}
