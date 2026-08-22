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
          <NavLink key={tab.to} to={tab.to} className="flex flex-1 flex-col items-center gap-1.5 py-1.5">
            {({ isActive }) => (
              <>
                <TabIcon name={tab.icon} className={`h-6 w-6 ${isActive ? 'text-seal-600' : 'text-ink-700/45'}`} />
                <span className={`text-center text-[10px] leading-tight font-bold ${isActive ? 'text-seal-600' : 'text-ink-700/45'}`}>
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
