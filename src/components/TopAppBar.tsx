import { useLocation } from 'react-router-dom';

const LABELS: Record<string, string> = {
  '/hall': '연회장',
  '/exploration': '탐사 활동',
  '/recess': '휴게시간',
  '/notebook': '탐사 수첩',
  '/profile': '내 정보',
};

export default function TopAppBar() {
  const location = useLocation();
  const label = Object.entries(LABELS).find(([path]) => location.pathname.startsWith(path))?.[1];

  return (
    <header
      className="top-bar-shell relative z-30 flex-none px-4"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 pb-2.5">
        <span className="font-gothic text-lg leading-none text-ink-black">아르카눔 마법학교</span>
        {label && <span className="font-mono text-[11px] font-bold text-seal-600">{label}</span>}
      </div>
    </header>
  );
}
