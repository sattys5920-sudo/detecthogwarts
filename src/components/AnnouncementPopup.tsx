import { useEffect, useState } from 'react';
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
      <div className="deckle-edge w-full max-w-xs border border-seal-500/40 bg-paper-50 p-5 text-center shadow-xl">
        <p className="font-mono text-[10px] font-bold tracking-widest text-seal-600">교내 안내</p>
        <p className="mt-3 whitespace-pre-wrap font-serif-kr text-sm leading-relaxed text-ink-900">{announcement.text}</p>
        <button
          type="button"
          onClick={dismiss}
          className="tablet-btn tablet-btn-dark mt-5 w-full rounded-lg px-4 py-2 text-xs font-bold"
        >
          확인
        </button>
      </div>
    </div>
  );
}
