import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import SvgDefs from './components/SvgDefs';
import { GameProvider } from './context/GameContext';
import AdminPage from './pages/AdminPage';
import ExplorationPage from './pages/ExplorationPage';
import ForestPage from './pages/ForestPage';
import HallPage from './pages/HallPage';
import HerbFarmPage from './pages/HerbFarmPage';
import InterrogationChatPage from './pages/InterrogationChatPage';
import InterrogationPage from './pages/InterrogationPage';
import LoadingPage from './pages/LoadingPage';
import NotebookPage from './pages/NotebookPage';
import ProfilePage from './pages/ProfilePage';
import QuidditchPage from './pages/QuidditchPage';
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
          path="/interrogation"
          element={
            <AppShell>
              <InterrogationPage />
            </AppShell>
          }
        />
        <Route
          path="/interrogation/:npcId"
          element={
            <AppShell>
              <InterrogationChatPage />
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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/quidditch" element={<QuidditchPage />} />
        <Route path="/forest" element={<ForestPage />} />
        <Route
          path="/herbfarm"
          element={
            <AppShell>
              <HerbFarmPage />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameProvider>
  );
}
