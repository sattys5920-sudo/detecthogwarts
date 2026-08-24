import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { BackProvider } from '../context/BackContext';
import { useGame } from '../context/GameContext';
import { useViewportHeight } from '../hooks/useViewportHeight';
import AnnouncementPopup from './AnnouncementPopup';
import AssignmentPopup from './AssignmentPopup';
import BottomTabBar from './BottomTabBar';
import PaperTexture from './PaperTexture';
import ScreenFrame from './ScreenFrame';
import TopAppBar from './TopAppBar';

export default function AppShell({ children }: { children: ReactNode }) {
  const { hasEntered } = useGame();
  const viewportHeight = useViewportHeight();
  if (!hasEntered) return <Navigate to="/" replace />;

  return (
    <BackProvider>
      <div
        className="fixed inset-x-0 top-0 flex flex-col overflow-hidden"
        style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
      >
        <PaperTexture />
        <ScreenFrame />
        <AnnouncementPopup />
        <AssignmentPopup />
        <TopAppBar />
        <main className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div className="mx-auto max-w-md px-4 pt-4 pb-6">{children}</div>
        </main>
        <BottomTabBar />
      </div>
    </BackProvider>
  );
}
