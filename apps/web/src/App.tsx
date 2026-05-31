import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminMetrics from './components/AdminMetrics';
import AiWorkspace from './components/AiWorkspace';
import AdultEducationResearch from './components/AdultEducationResearch';
import AuthorWorkbench from './components/author/AuthorWorkbench';
import Catalog from './components/Catalog';
import CompleteProfile from './components/CompleteProfile';
import CourseEntryDiagnostic from './components/CourseEntryDiagnostic';
import Dashboard from './components/Dashboard';
import EconomicReport from './components/EconomicReport';
import ErrorBoundary from './components/ErrorBoundary';
import FeedbackWidget from './components/FeedbackWidget';
import Guide from './components/Guide';
import Layout from './components/Layout';
import { OnboardingProvider } from './components/onboarding/OnboardingProvider';
import LlmSystemReport from './components/LlmSystemReport';
import Login from './components/Login';
import MarketAnalysis from './components/MarketAnalysis';
import MathLiterature from './components/MathLiterature';
import MathSections from './components/MathSections';
import MathTopic from './components/MathTopic';
import MvpReport from './components/MvpReport';
import OnboardingGuard from './components/OnboardingGuard';
import Pricing from './components/Pricing';
import ProfilePage from './components/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import KnowledgeGraphTreePage from './components/KnowledgeGraphTreePage';
import LearningPlansPage from './components/LearningPlansPage';
import MyNotesPage from './components/lectures/MyNotesPage';
import LectureViewPage from './components/lectures/LectureViewPage';
import ProgressDashboard from './components/ProgressDashboard';
import ProRoute from './components/ProRoute';
import Registration from './components/Registration';
import Reports from './components/Reports';
import TokenOptimization from './components/TokenOptimization';

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <OnboardingProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />

        {/* Course entry diagnostic — only shown once to registered users */}
        <Route element={<Layout />}>
          <Route path="/courses/:courseId" element={<CourseEntryDiagnostic />} />
        </Route>

        {/* Math subject pages — publicly readable */}
        <Route element={<Layout />}>
          <Route path="/subjects/mathematics" element={<MathSections />} />
          <Route path="/subjects/mathematics/literature" element={<MathLiterature />} />
        </Route>
        {/* MathTopic ходит со своим полноценным фреймом (сайдбар, шапка, футер).
            Поэтому вне общего Layout — иначе двойной сайдбар и пустое поле слева. */}
        <Route path="/subjects/mathematics/topics/:topicName" element={<MathTopic />} />

        {/* Reports — accessible to all, within the main layout */}
        <Route element={<Layout />}>
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/mvp" element={<MvpReport />} />
          <Route path="/reports/market-analysis" element={<MarketAnalysis />} />
          <Route path="/reports/adult-education-research" element={<AdultEducationResearch />} />
          <Route path="/reports/token-optimization" element={<TokenOptimization />} />
          <Route path="/reports/economic-report" element={<EconomicReport />} />
          <Route path="/reports/llm-system-report" element={<LlmSystemReport />} />
        </Route>

        {/* App routes with dashboard + catalog layout available to all.
            Logged-in users without a survey-completed profile get redirected to /profile/complete
            by OnboardingGuard. Guests pass through. */}
        <Route element={<Layout />}>
          <Route element={<OnboardingGuard />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/workspace" element={<AiWorkspace />} />
            <Route path="/mentor" element={<Navigate to="/workspace" replace />} />
            <Route path="/personal-ai" element={<Navigate to="/workspace" replace />} />
          </Route>
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/guide" element={<Guide />} />
        </Route>

        {/* Protected app routes (auth required) */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route element={<OnboardingGuard />}>
              <Route path="/progress" element={<ProgressDashboard courseId="math-for-data-science" />} />
              <Route path="/graph" element={<KnowledgeGraphTreePage />} />
              <Route path="/plan" element={<LearningPlansPage />} />
              <Route path="/my-notes" element={<MyNotesPage />} />
              <Route path="/my-notes/:lectureId" element={<LectureViewPage />} />
              <Route path="/admin/metrics" element={<AdminMetrics />} />
            </Route>
            {/* /profile* must stay OUTSIDE OnboardingGuard so the user can actually fill the form.
                /profile — редактирование без email/пароля (для уже залогиненных через OAuth).
                /register — отдельный маршрут с регистрацией email+пароль. */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/complete" element={<CompleteProfile />} />
          </Route>
        </Route>

        {/* Pro routes (auth + active plan/trial required) */}
        <Route element={<ProRoute />}>
          <Route element={<Layout />}>
            <Route path="/author" element={<AuthorWorkbench />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <FeedbackWidget />
      </OnboardingProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
