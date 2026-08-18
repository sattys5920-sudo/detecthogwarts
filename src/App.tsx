import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import SvgDefs from './components/SvgDefs';
import { GameProvider } from './context/GameContext';
import ExplorationPage from './pages/ExplorationPage';
import HallPage from './pages/HallPage';
import LoadingPage from './pages/LoadingPage';
import NotebookPage from './pages/NotebookPage';
import ProfilePage from './pages/ProfilePage';
import RecessPage from './pages/RecessPage';

export default function App() {
  return (
    <GameProvider>
      <SvgDefs />
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route
          path="/hall"
          element={
            <AppShell>
              <HallPage />
            </AppShell>
          }
        />
        <Route
          path="/exploration"
          element={
            <AppShell>
              <ExplorationPage />
            </AppShell>
          }
        />
        <Route
          path="/recess"
          element={
            <AppShell>
              <RecessPage />
            </AppShell>
          }
        />
        <Route
          path="/notebook"
          element={
            <AppShell>
              <NotebookPage />
            </AppShell>
          }
        />
        <Route
          path="/profile"
          element={
            <AppShell>
              <ProfilePage />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
}
