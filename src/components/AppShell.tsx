import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import BottomTabBar from './BottomTabBar';
import Starfield from './Starfield';

export default function AppShell({ children }: { children: ReactNode }) {
  const { hasEntered } = useGame();
  if (!hasEntered) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-svh">
      <Starfield />
      <div className="mx-auto max-w-md px-4 pb-24 pt-6">{children}</div>
      <BottomTabBar />
    </div>
  );
}
