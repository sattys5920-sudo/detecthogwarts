import { useEffect, useState } from 'react';
import CornerFlourish from './CornerFlourish';
import { listenAnnouncement, type Announcement } from '../firebase/announcements';

const SEEN_KEY = 'arcanum-announcement-seen';

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(() => localStorage.getItem(SEEN_KEY));

  useEffect(() => listenAnnouncement(setAnnouncement), []);

  if (!announcement || announcement.id === dismissedId) return null;

  function dismiss() {
    if (!announcement) return;
    localStorage.setItem(SEEN_KEY, announcement.id);
    setDismissedId(announcement.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-black/60 px-6" role="alertdialog" aria-modal="true">
      <div className="deckle-edge relative flex max-h-[85vh] w-full max-w-xs flex-col border border-seal-500/40 bg-paper-50 p-5 text-center shadow-[0_4px_20px_rgba(23,19,15,0.35)]">
        <CornerFlourish corner="tl" className="pointer-events-none absolute -top-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="tr" className="pointer-events-none absolute -top-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="bl" className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-5 w-5 text-gold-600/70" />
        <CornerFlourish corner="br" className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-5 w-5 text-gold-600/70" />
        <p className="flex-none font-mono text-[10px] font-bold tracking-widest text-seal-600">교내 안내</p>
        <p className="mt-3 flex-1 overflow-y-auto whitespace-pre-wrap font-serif-kr text-sm leading-relaxed text-ink-900">
          {announcement.text}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="tablet-btn tablet-btn-dark mt-5 w-full flex-none px-4 py-2 text-xs font-bold"
        >
          확인
        </button>
      </div>
    </div>
  );
}
