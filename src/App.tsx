import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import { GameProvider } from './context/GameContext';
import ExplorePage from './pages/ExplorePage';
import HallPage from './pages/HallPage';
import HousePage from './pages/HousePage';
import LoadingPage from './pages/LoadingPage';
import MainPage from './pages/MainPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route
          path="/main"
          element={
            <AppShell>
              <MainPage />
            </AppShell>
          }
        />
        <Route
          path="/house"
          element={
            <AppShell>
              <HousePage />
            </AppShell>
          }
        />
        <Route
          path="/hall"
          element={
            <AppShell>
              <HallPage />
            </AppShell>
          }
        />
        <Route
          path="/explore"
          element={
            <AppShell>
              <ExplorePage />
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
