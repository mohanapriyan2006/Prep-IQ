import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import Roadmap from './pages/Roadmap';
import Analytics from './pages/Analytics';
import ProblemWorkspace from './pages/ProblemWorkspace';
import Contests from './pages/Contests';
import Profile from './pages/Profile';
import Tutorials from './pages/Tutorials';
import MockTestPage from './pages/MockTestPage';
import RoadmapDetail from './pages/RoadmapDetail';
import AssessmentPage from './pages/AssessmentPage';
import AssessmentArena from './pages/AssessmentArena';
import Onboarding from './pages/Onboarding';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/problems" element={<Problems />} />
          <Route path="/problems/:problemId" element={<ProblemWorkspace />} />
          <Route path="/assessment/:sessionId/arena" element={<AssessmentArena />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/roadmap/day/:dayId" element={<RoadmapDetail />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/mock-test" element={<MockTestPage />} />
          <Route path="/mock-tests" element={<MockTestPage />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
