import { useLocation, useNavigate } from 'react-router-dom';
import { useBackContext } from '../context/BackContext';

const LABELS: Record<string, string> = {
  '/hall': '연회장',
  '/exploration': '탐사 활동',
  '/recess': '휴게시간',
  '/notebook': '탐사 수첩',
  '/profile': '내 정보',
};

export default function TopAppBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { handler } = useBackContext();
  const label = Object.entries(LABELS).find(([path]) => location.pathname.startsWith(path))?.[1];

  function handleBack() {
    if (handler) handler();
    else navigate(-1);
  }

  return (
    <header
      className="top-bar-shell relative z-30 flex-none px-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-[2rem_1fr_2rem] items-center gap-2 pb-2.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-ink-700/30 bg-paper-50/70 text-sm font-bold text-ink-700/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] hover:bg-paper-50 hover:text-ink-900"
        >
          ←
        </button>
        <span className="font-gothic truncate text-center text-lg leading-none tracking-wide text-ink-black">
          아르카눔 마법학교
        </span>
        <div className="flex justify-end">
          {label && (
            <span className="rounded-full border border-seal-700/40 bg-seal-600 px-2.5 py-1 text-[10px] font-bold leading-none whitespace-nowrap text-paper-50 shadow-[0_1px_2px_rgba(42,28,18,0.3)]">
              {label}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
