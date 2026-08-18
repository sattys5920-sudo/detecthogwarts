import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/hall', label: '연회장' },
  { to: '/exploration', label: '탐사 활동' },
  { to: '/recess', label: '휴게시간' },
  { to: '/notebook', label: '탐사 수첩' },
  { to: '/profile', label: '내 정보' },
];

export default function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-700/20 bg-paper-200 px-2 pt-2"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between gap-1.5">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `tablet-tab flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2.5 text-center text-[11px] font-bold leading-tight transition-all ${
                isActive ? 'tablet-tab-active text-seal-600' : 'text-ink-700/70'
              }`
            }
          >
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
