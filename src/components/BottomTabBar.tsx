import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/main', label: '메인', icon: '🏰' },
  { to: '/house', label: '기숙사', icon: '🛡️' },
  { to: '/hall', label: '강당', icon: '🕯️' },
  { to: '/explore', label: '탐험', icon: '🧭' },
  { to: '/profile', label: '프로필', icon: '🎫' },
];

export default function BottomTabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-700/15 bg-paper-100/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-serif-kr transition-colors ${
                isActive ? 'text-seal-600' : 'text-ink-500/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
