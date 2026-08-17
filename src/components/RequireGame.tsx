import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';

export default function RequireGame({ children }: { children: ReactNode }) {
  const { isStarted } = useGame();
  if (!isStarted) return <Navigate to="/" replace />;
  return <>{children}</>;
}
