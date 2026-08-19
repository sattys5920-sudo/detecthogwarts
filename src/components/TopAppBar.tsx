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
      className="top-bar-shell relative z-30 flex-none px-2"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)' }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2 pb-2.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg font-bold text-ink-700/70 hover:bg-paper-50/60 hover:text-ink-900"
        >
          ←
        </button>
        <span className="font-gothic text-lg leading-none text-ink-black">아르카눔 마법학교</span>
        {label && <span className="ml-auto flex-none font-mono text-[11px] font-bold text-seal-600">{label}</span>}
      </div>
    </header>
  );
}
