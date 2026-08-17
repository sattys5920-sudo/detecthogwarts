import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { GameProvider } from './context/GameContext';
import AccusationPage from './pages/AccusationPage';
import HomePage from './pages/HomePage';
import InvestigatePage from './pages/InvestigatePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LocationPage from './pages/LocationPage';
import NotebookPage from './pages/NotebookPage';
import ProloguePage from './pages/ProloguePage';
import ResultPage from './pages/ResultPage';
import SuspectPage from './pages/SuspectPage';

export default function App() {
  return (
    <GameProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/prologue" element={<ProloguePage />} />
          <Route path="/investigate" element={<InvestigatePage />} />
          <Route path="/investigate/:locationId" element={<LocationPage />} />
          <Route path="/suspects/:suspectId" element={<SuspectPage />} />
          <Route path="/notebook" element={<NotebookPage />} />
          <Route path="/accusation" element={<AccusationPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </GameProvider>
  );
}
