import { useState } from 'react';

const VIDEO_ID = 'nOM_BfzMI7U';
const SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;

function postCommand(func: 'mute' | 'unMute' | 'playVideo' | 'pauseVideo') {
  const iframe = document.getElementById('site-bg-video') as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
}

/**
 * A small persistent corner video that autoplays as soon as the site loads and keeps playing
 * across every page (mounted once at the App root, not per-route). Browsers block unmuted
 * autoplay, so it starts muted — tapping the button unmutes + plays via the YouTube postMessage
 * API, which counts as the user gesture browsers require before allowing audio. The video frame
 * stays technically present (small, behind the button) rather than hidden — YouTube's embed terms
 * require the player to stay visible, so it can't be blacked out while still streaming.
 */
export default function SiteBackgroundVideo() {
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (playing) {
      postCommand('pauseVideo');
    } else {
      postCommand('unMute');
      postCommand('playVideo');
    }
    setPlaying((p) => !p);
  }

  return (
    <div className="fixed top-3 right-3 z-40 h-11 w-11 overflow-hidden rounded-full border border-ink-700/30 shadow-lg">
      <iframe
        id="site-bg-video"
        src={SRC}
        title="배경 영상"
        allow="autoplay; encrypted-media"
        className="h-full w-full"
        style={{ border: 0 }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? '일시정지' : '재생'}
        className="absolute inset-0 flex items-center justify-center bg-ink-black/70 text-paper-50 transition-colors hover:bg-ink-black/85"
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
