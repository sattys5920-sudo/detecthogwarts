import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/notices', label: '공지' },
  { to: '/class', label: '수업' },
  { to: '/house', label: '기숙사' },
  { to: '/quest', label: '임무' },
  { to: '/shop', label: '상점' },
  { to: '/profile', label: '프로필' },
];

export default function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-700/15 bg-paper-100/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-1 py-4 text-sm font-bold transition-colors ${
                isActive ? 'text-ink-red' : 'text-ink-500/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-[3px] w-7 rounded-full bg-ink-red" />}
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
