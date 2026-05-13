import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';

import { TimerProvider } from "./context/TimerContext";
import { useSettingsStore } from './lib/store/settings';
import { useAuthStore } from './lib/store/auth';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import {BottomNav} from "./shell/BottomNav";
import {TopBar} from "@/shell/TopBar";

// Pages — ルート単位で遅延ロード
const DashboardPage      = lazy(() => import('./pages/dashboardPage'));
const DailyLogsPage      = lazy(() => import('./pages/dailyLogsPage'));
const DailyWorkspacePage  = lazy(() => import('./pages/./dailyWorkspacePage'));
const ExamPage           = lazy(() => import('./pages/examPage'));
const NoteListPage           = lazy(() => import('./pages/noteListPage'));
const PracticeSessionPage  = lazy(() => import('./pages/practiceSessionPage'));
const MorningBugfixPage   = lazy(() => import('./pages/morningBugfixPage'));
const FlashBugfixPage     = lazy(() => import('./pages/flashBugfixPage'));
const ProfilePage         = lazy(() => import('./pages/profilePage'));
const SubjectPage        = lazy(() => import('./pages/subjectPage'));
const LoginPage          = lazy(() => import('./pages/loginPage'));
const PrivacyPage        = lazy(() => import('./pages/privacyPage'));
const TermsPage          = lazy(() => import('./pages/termsPage'));

function PageFallback() {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <LoadingSpinner size="md" />
        </div>
    )
}

// 未認証ならログインページへリダイレクト
function PrivateRoute() {
    const token = useAuthStore((s) => s.token)
    const location = useLocation()
    if (!token) return <Navigate to="/login" state={{ from: location }} replace />
    return <Outlet />
}

// ナビゲーションバーを表示する共通レイアウト
function AppLayout() {
    const loadSubjects = useSettingsStore((s) => s.loadSubjects)
    const loadMaterials = useSettingsStore((s) => s.loadMaterials)
    const loadSubCategories = useSettingsStore((s) => s.loadSubCategories)

    useEffect(() => {
        loadSubjects()
        loadMaterials()
        loadSubCategories()
    }, [])

    return (
        <TimerProvider>
            <TopBar />
            <main style={{ paddingBottom: 'calc(56px + env(safe-area-inset-bottom))' }}>
                <Outlet />
            </main>
            <BottomNav />
        </TimerProvider>
    );
}

// ナビゲーションバーを表示しないシンプルなレイアウト（ログイン等）
function SimpleLayout() {
    return (
        <main>
            <Outlet />
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    {/* 1. 認証・規約系（ナビなし） */}
                    <Route element={<SimpleLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                    </Route>

                    {/* 2. メイン機能（ナビあり・要認証） */}
                    <Route element={<PrivateRoute />}>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/workspace/daily-logs" element={<DailyLogsPage />} />
                        <Route path="/workspace/:date" element={<DailyWorkspacePage />} />
                        <Route path="/exam" element={<ExamPage />} />
                        <Route path="/notelist" element={<NoteListPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/subjects/:name" element={<SubjectPage />} />
                        <Route path="/practice/:subject" element={<PracticeSessionPage />} />
                        <Route path="/morning-bugfix" element={<MorningBugfixPage />} />
                        <Route path="/subjects/:name/flash-bugfix" element={<FlashBugfixPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
