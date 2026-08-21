import { NavLink } from 'react-router-dom';
import TabIcon, { type TabIconName } from './TabIcon';

const TABS: { to: string; label: string; icon: TabIconName }[] = [
  { to: '/hall', label: '연회장', icon: 'hall' },
  { to: '/exploration', label: '탐사 활동', icon: 'exploration' },
  { to: '/recess', label: '휴게시간', icon: 'recess' },
  { to: '/notebook', label: '탐사 수첩', icon: 'notebook' },
  { to: '/profile', label: '내 정보', icon: 'profile' },
];

export default function BottomTabBar() {
  return (
    <nav
      className="tab-bar-shell relative z-30 flex-none px-2 pt-2.5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.6rem)' }}
    >
      <div className="mx-auto flex max-w-md items-start justify-between gap-1">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} className="flex flex-1 flex-col items-center gap-1 py-1">
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                    isActive
                      ? 'border-seal-700 bg-seal-600 text-paper-50 shadow-[0_2px_4px_rgba(42,28,18,0.35)]'
                      : 'border-ink-700/20 bg-paper-50/60 text-ink-700/60'
                  }`}
                >
                  <TabIcon name={tab.icon} className="h-[19px] w-[19px]" />
                </span>
                <span
                  className={`text-center text-[10px] leading-tight font-bold ${
                    isActive ? 'text-seal-600' : 'text-ink-700/60'
                  }`}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
