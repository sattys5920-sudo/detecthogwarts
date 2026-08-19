import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import BottomTabBar from './BottomTabBar';
import PaperTexture from './PaperTexture';
import TopAppBar from './TopAppBar';

export default function AppShell({ children }: { children: ReactNode }) {
  const { hasEntered } = useGame();
  if (!hasEntered) return <Navigate to="/" replace />;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <PaperTexture />
      <TopAppBar />
      <main className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <div className="mx-auto max-w-md px-4 pt-4 pb-6">{children}</div>
      </main>
      <BottomTabBar />
    </div>
  );
}
