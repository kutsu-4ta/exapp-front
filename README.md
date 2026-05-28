# exapp (tsumiki) — フロントエンド

資格試験・受験勉強を管理する Web アプリ **tsumiki** のフロントエンドリポジトリ。

アプリの全体概要・バックエンド構成は `exapp-backend/README.md` を参照。

---

## 目次

1. [技術スタック](#技術スタック)
2. [セットアップ](#セットアップ)
3. [ページ構成](#ページ構成)
4. [アーキテクチャ](#アーキテクチャ)
5. [状態管理](#状態管理)
6. [BugFix フロー](#bugfix-フロー)
7. [不要コードの洗い出し](#不要コードの洗い出し)

---

## 技術スタック

| 項目        | 技術                      |
|-----------|-------------------------|
| Framework | React 19 + TypeScript   |
| Build     | Vite                    |
| Routing   | React Router v7         |
| State     | Zustand v5              |
| CSS       | Tailwind CSS v4         |
| Chart     | Recharts                |
| Auth      | Firebase SDK            |
| DnD       | @dnd-kit（Sprint Kanban） |

---

## セットアップ

### 前提条件

- Node.js 20+
- バックエンドが `http://localhost:8000` で起動済み

### 手順

```bash
# 1. 依存関係インストール
npm install

# 2. 環境変数ファイルを作成
cp .env.example .env.local

# 3. .env.local を編集（必須項目）
#    VITE_BACKEND_ROOT=http://localhost:8000
#    VITE_FIREBASE_API_KEY=...
#    VITE_FIREBASE_AUTH_DOMAIN=...
#    VITE_FIREBASE_PROJECT_ID=...
#    （その他 Firebase 設定）

# 4. 開発サーバー起動
npm run dev
# → http://localhost:5173
```

### 主要スクリプト

```bash
npm run dev      # 開発サーバー起動
npm run build    # 型チェック + Vite ビルド
npm run lint     # ESLint
npm run preview  # ビルド結果のプレビュー
```

### 環境変数

| 変数                          | 説明                 |
|-----------------------------|--------------------|
| `VITE_BACKEND_ROOT`         | バックエンドの URL        |
| `VITE_FIREBASE_API_KEY`     | Firebase API キー    |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth ドメイン |
| `VITE_FIREBASE_PROJECT_ID`  | Firebase プロジェクト ID |
| `VITE_FIREBASE_APP_ID`      | Firebase App ID    |

---

## ページ構成

### ルーティング（`src/App.tsx`）

```
/                              → DashboardPage
/workspace/daily-logs          → DailyLogsPage
/workspace/:date               → DailyWorkspacePage
/notelist                      → NoteListPage
/practice/:subject             → PracticeSessionPage
/morning-bugfix                → MorningBugfixPage
/subjects/:name/flash-bugfix   → FlashBugfixPage  （Flash / Deg 共用）
/exam                          → ExamPage
/subjects/:name                → SubjectPage
/sprint                        → SprintPage
/profile                       → ProfilePage
/problems/:id/graph            → ProblemGraphPage （フルスクリーン）
/login                         → LoginPage
```

### レイアウト

- **iPad** (`useIsTablet` hook): サイドバー + メインのサイドバイサイドレイアウト
- **スマホ / デスクトップ**: トップバー + メイン + ボトムナビ

---

## アーキテクチャ

### ディレクトリ構成

```
src/
├── pages/           # ページコンポーネント（Route に対応）
├── components/      # 機能別コンポーネント
│   ├── common/      # 共通 UI（BottomSheet, Selector など）
│   ├── dashboard/
│   ├── exam/
│   ├── note/
│   ├── practice/
│   ├── sprint/
│   ├── subject/
│   └── workspace/
├── hooks/           # カスタム hooks
├── lib/
│   ├── api/         # バックエンドとの通信（エンドポイント別）
│   └── store/       # Zustand ストア
├── types/           # 型定義
├── styles/          # デザイントークン
└── context/         # React Context（TimerContext）
```

### 設計方針

- **API 通信は `src/lib/api/` に集約**。各ファイルがエンドポイントのグループに対応。
- **ページはデータ取得と状態管理を担当**。表示ロジックはコンポーネントに渡す。
- **モーダル駆動の UX**。多くの操作は `BottomSheet` ベースのモーダルで完結。
- **問題ノートのハッシュタグ**（`#Definition`, `#Formula`, `#Keyword` など）がデータの中核。

### HTTP クライアント（`src/lib/client.ts`）

- 認証ヘッダーを自動付与
- API レート制限（RPD/RPM）を `apiTraffic` ストアでチェック
- 401 時に自動ログアウト・リダイレクト

### キャッシュ戦略

| 種類               | 実装                                 |
|------------------|------------------------------------|
| ページキャッシュ（5分 TTL） | `src/lib/pageCache.ts`             |
| 科目・教材・論点         | `settings` Zustand ストア             |
| ワークスペース下書き       | `workspaceDraft` ストア（localStorage） |
| スプリント・チケット       | `sprintStore` ストア                  |

---

## 状態管理

### Zustand ストア一覧（`src/lib/store/`）

| ストア               | localStorage 永続化 | 主な内容            |
|-------------------|------------------|-----------------|
| `auth`            | ✓                | ユーザー情報・トークン     |
| `settings`        | —                | 科目・教材・論点・カラー設定  |
| `workspaceDraft`  | ✓                | 日次ログ下書き（日付キー）   |
| `ticketTemplates` | ✓                | チケット生成テンプレート    |
| `sprintStore`     | —                | スプリント・チケットキャッシュ |
| `practiceStore`   | —                | 練習セッション状態       |
| `apiTraffic`      | —                | API レート制限トラッキング |

### API レート制限（`src/lib/api/apiWeights.ts`）

Gemini の無料枠（20 RPD / 5 RPM）を超えないようにフロントエンドで管理している。

| 重み           | 用途                          |
|--------------|-----------------------------|
| HIGH (500)   | 画像解析                        |
| MIDDLE (100) | テキスト生成（BugFix カード、AI アドバイス） |
| LOW (20)     | 集計・分析                       |
| TINY (1)     | 通常の CRUD                    |

---

## BugFix フロー

### 共通コンポーネント

3 つの BugFix モードはすべて同じコンポーネントを使う。

```
useFlashCardSession(fetchFn)   # カードの読み込み・ナビゲーション状態
      ↓
FlashCardSessionView           # カード UI（表裏・○△× ジャッジ）
```

### モード別のフェッチ関数（`src/lib/api/morningQuiz.ts`）

| モード     | 関数                                  | 設定モーダル                   |
|---------|-------------------------------------|--------------------------|
| Morning | `fetchMorningQuiz()`                | なし（自動選出）                 |
| Flash   | `fetchFlashBugfix(subject, config)` | `FlashBugfixConfigModal` |
| Deg     | `fetchDegBugfix(config)`            | `DegBugfixConfigModal`   |

### カードのデータ形式

```typescript
quiz: {
    question: string    // カード表: AI が生成したキーワード質問
    explanation: string // カード裏: #Definition + #Formula
}
|
null              // null の問題はスキップ
```

---

## 不要コードの洗い出し

### フロントエンド側で削除を推奨

現時点では確認済みの削除対象なし。2026-05 の改修で整理済み。

### 2026-05 改修で削除済み

| 削除対象                                          | 理由             |
|-----------------------------------------------|----------------|
| `src/hooks/useQuizSession.ts`                 | 4択モード廃止        |
| `src/components/practice/QuizSessionView.tsx` | 同上             |
| `FlashBugfixConfig.quizMode` / `formulaOnly`  | 4択・公式チェックモード廃止 |
| `DegBugfixConfig.quizMode` / `formulaOnly`    | 同上             |

### バックエンド起因で将来的に整理が必要なもの

バックエンドの `knowledge_digests` テーブルが削除された場合、フロントエンド側への影響はない（直接参照していない）。

詳細は `exapp-backend/README.md` の「不要コードの洗い出し」を参照。
