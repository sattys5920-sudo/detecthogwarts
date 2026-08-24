import { useState } from 'react';

const VIDEO_ID = 'nOM_BfzMI7U';
const SRC = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`;

/**
 * A small persistent corner video that autoplays as soon as the site loads and keeps playing
 * across every page (mounted once at the App root, not per-route). Browsers block unmuted
 * autoplay, so it starts muted — the speaker button unmutes it via the YouTube postMessage API,
 * which counts as the user gesture browsers require before allowing audio.
 */
export default function SiteBackgroundVideo() {
  // Starts minimized (a small corner icon, not the full preview box) so it doesn't pop up
  // visibly on load — YouTube's embed terms require the player to stay visible, so it can't
  // be fully hidden while playing, but a small always-present icon is the closest compliant fit.
  const [minimized, setMinimized] = useState(true);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const iframe = document.getElementById('site-bg-video') as HTMLIFrameElement | null;
    if (!iframe?.contentWindow) return;
    const next = !muted;
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: next ? 'mute' : 'unMute', args: [] }), '*');
    setMuted(next);
  }

  return (
    <div
      className={`fixed top-3 right-3 z-40 overflow-hidden rounded-lg border border-ink-700/30 bg-ink-black shadow-lg transition-all duration-200 ${
        minimized ? 'h-9 w-9' : 'h-[100px] w-[178px]'
      }`}
    >
      <iframe
        id="site-bg-video"
        src={SRC}
        title="배경 영상"
        allow="autoplay; encrypted-media"
        className="h-full w-full"
        style={{ border: 0 }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink-black/70 px-1 py-0.5">
        {!minimized && (
          <button
            type="button"
            onClick={toggleMute}
            className="px-1 text-[11px] leading-none text-paper-50"
            aria-label={muted ? '소리 켜기' : '소리 끄기'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setMinimized((m) => !m)}
          className="ml-auto px-1 text-[10px] leading-none text-paper-50"
          aria-label={minimized ? '펼치기' : '접기'}
        >
          {minimized ? '▸' : '▾'}
        </button>
      </div>
    </div>
  );
}
