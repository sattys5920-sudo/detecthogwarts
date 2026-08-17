import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import SvgDefs from './components/SvgDefs';
import { GameProvider } from './context/GameContext';
import ClassPage from './pages/ClassPage';
import HousePage from './pages/HousePage';
import LoadingPage from './pages/LoadingPage';
import NoticesPage from './pages/NoticesPage';
import ProfilePage from './pages/ProfilePage';
import QuestPage from './pages/QuestPage';
import ShopPage from './pages/ShopPage';

export default function App() {
  return (
    <GameProvider>
      <SvgDefs />
      <Routes>
        <Route path="/" element={<LoadingPage />} />
        <Route
          path="/notices"
          element={
            <AppShell>
              <NoticesPage />
            </AppShell>
          }
        />
        <Route
          path="/class"
          element={
            <AppShell>
              <ClassPage />
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
          path="/quest"
          element={
            <AppShell>
              <QuestPage />
            </AppShell>
          }
        />
        <Route
          path="/shop"
          element={
            <AppShell>
              <ShopPage />
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
