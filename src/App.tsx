import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';

import { TimerProvider } from "./context/TimerContext";

// Pages のインポート
import DashboardPage from "./pages/dashboardPage";
import DailyLogsPage from "./pages/dailyLogsPage";
import WorkspaceDatePage from "./pages/workspaceDatePage";
import ExamPage from "./pages/examPage";
import WeakPage from "./pages/weakPage";
import ProfilePage from "./pages/profilePage";
import LoginPage from "./pages/loginPage";
import PrivacyPage from "./pages/privacyPage";
import TermsPage from "./pages/termsPage";
import {BottomNav} from "./shell/BottomNav";
import {TopBar} from "@/shell/TopBar";

// ナビゲーションバーを表示する共通レイアウト
function AppLayout() {
    return (
        <TimerProvider>
            <TopBar />
            <main className="pb-20"> {/* BottomNavの高さ分余白を確保 */}
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

                {/* 2. メイン機能（ナビあり） */}
                <Route element={<AppLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/workspace/daily-logs" element={<DailyLogsPage />} />
                    <Route path="/workspace/:date" element={<WorkspaceDatePage />} />
                    <Route path="/exam" element={<ExamPage />} />
                    <Route path="/weak" element={<WeakPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                </Route>

                {/* 3. 404対応（未定義のパスはTOPへリダイレクト） */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;