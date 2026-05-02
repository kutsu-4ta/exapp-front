import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { TimerProvider } from "./context/TimerContext";
import { useSettingsStore } from './lib/store/settings';
import { useAuthStore } from './lib/store/auth';

// Pages のインポート
import DashboardPage from "./pages/dashboardPage";
import DailyLogsPage from "./pages/dailyLogsPage";
import WorkspaceDatePage from "./pages/workspaceDatePage";
import ExamPage from "./pages/examPage";
import WeakPage from "./pages/weakPage";
import ProblemDetailPage from "./pages/problemDetailPage";
import PracticeSessionPage from "./pages/practiceSessionPage";
import ProfilePage from "./pages/profilePage";
import SubjectPage from "./pages/subjectPage";
import LoginPage from "./pages/loginPage";
import PrivacyPage from "./pages/privacyPage";
import TermsPage from "./pages/termsPage";
import {BottomNav} from "./shell/BottomNav";
import {TopBar} from "@/shell/TopBar";

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

    useEffect(() => {
        loadSubjects()
        loadMaterials()
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
                    <Route path="/workspace/:date" element={<WorkspaceDatePage />} />
                    <Route path="/exam" element={<ExamPage />} />
                    <Route path="/weak" element={<WeakPage />} />
                    <Route path="/weak/:id" element={<ProblemDetailPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/subjects/:name" element={<SubjectPage />} />
                    <Route path="/practice/:subject" element={<PracticeSessionPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;