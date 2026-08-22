import { useNavigate } from 'react-router-dom';
import { useBackContext } from '../context/BackContext';
import { useNotebook } from '../hooks/useNotebook';

export default function TopAppBar() {
  const navigate = useNavigate();
  const { handler } = useBackContext();
  const { entries } = useNotebook();
  const unresolved = entries.filter((e) => e.status !== '확인됨').length;

  function handleBack() {
    if (handler) handler();
    else navigate(-1);
  }

  return (
    <header
      className="top-bar-shell relative z-30 flex-none px-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-[2.25rem_1fr_2.25rem] items-center gap-2 pb-2.5">
        <button
          type="button"
          onClick={handleBack}
          aria-label={handler ? '뒤로' : '메뉴'}
          className="flex h-9 w-9 flex-none items-center justify-center text-ink-700/80 hover:text-ink-900"
        >
          {handler ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M15 5 8 12l7 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <div className="text-center leading-none">
          <p className="font-gothic text-base tracking-wide text-ink-black">HWCF</p>
          <p className="mt-1 font-mono text-[8px] font-bold tracking-[0.3em] text-ink-500">WIZARDING SCHOOL</p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/notebook')}
          aria-label="탐사 수첩"
          className="relative flex h-9 w-9 flex-none items-center justify-center text-ink-700/80 hover:text-ink-900"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            />
            <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          {unresolved > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-paper-50 bg-seal-600 px-1 text-[9px] font-bold leading-none text-paper-50">
              {unresolved}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
