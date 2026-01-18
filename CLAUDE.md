# CLAUDE.md - AI支援開発ガイド

**プロジェクト**: 天体観測できるかな？ (Astronomical Observation Weather Dashboard)
**バージョン**: 3.1.9
**開発元**: 株式会社リバーランズ・コンサルティング
**最終更新日**: 2026-01-18

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [リポジトリ構造](#リポジトリ構造)
3. [アーキテクチャとデザイン](#アーキテクチャとデザイン)
4. [コード構成](#コード構成)
5. [開発ワークフロー](#開発ワークフロー)
6. [コーディング規約](#コーディング規約)
7. [技術スタック](#技術スタック)
8. [ファイルリファレンス](#ファイルリファレンス)
9. [よくある開発タスク](#よくある開発タスク)
10. [AI支援開発のための重要な注意事項](#ai支援開発のための重要な注意事項)

---

## プロジェクト概要

### このプロジェクトについて

これは、ユーザーが天体観測に最適な条件を判断するのに役立つ**天体観測気象ダッシュボード**です。以下の要素を統合しています：

- **気象データ** (雲量・湿度・視程・風速)
- **天文計算** (太陽・月の位置、薄明時刻、惑星位置)
- **ISS追跡** (国際宇宙ステーションの軌道予測)
- **総合スコアリング** (星空視認性を0-100点でスコア化)

### 主要機能

1. **星空視認性スコア**: 複数の気象要素を加重評価
2. **天文薄明計算**: 観測ウィンドウの正確なタイミング
3. **24時間タイムライン可視化**: 観測適性を色分けして表示
4. **ISSパス予測**: 7日間の予報と星座図可視化
5. **インタラクティブ星座図**: Canvas による天体オブジェクトのプロット
6. **ナイトビジョンモード**: 暗順応を保つ赤色表示
7. **お気に入り地点**: 最大5地点の観測地を保存
8. **天の川視認性**: 銀河中心位置と視認性予測

### 使用言語

- **UI言語**: 日本語
- **コードコメント**: 日本語・英語混在（ユーザー向け機能は日本語優先）
- **ドキュメント**: 主に日本語

---

## リポジトリ構造

```
weather_dashboard/
├── CHANGELOG.md              # バージョン履歴（セマンティックバージョニング）
├── README.md                 # ユーザー向けドキュメント（日本語）
├── CLAUDE.md                 # 本ファイル - AI支援開発ガイド
└── docs/                     # アプリケーションルート（静的サイトとして配信）
    ├── index.html            # メインHTMLファイル
    ├── main.js               # エントリーポイント（ES Module）
    ├── state.js              # 集約されたアプリケーション状態
    ├── constants.js          # 静的データ（流星群、季節の天体）
    ├── ui-utils.js           # 共通UI制御（アコーディオン、ナイトビジョン）
    ├── location-service.js   # 位置情報、地図、お気に入り管理
    ├── weather-service.js    # 気象データ取得、ダッシュボード描画
    ├── iss-service.js        # ISS軌道計算、通知
    ├── astronomy-service.js  # 惑星、銀河、天文イベント
    ├── CHANGELOG.md          # docs フォルダ内の CHANGELOG 複製
    └── internal_spec.md      # 技術仕様書（日本語）
```

### ポイント

- **ビルドプロセス不要**: `docs/` フォルダから直接配信される純粋な HTML/CSS/JS
- **ES Modules**: すべてのJavaScriptファイルで `export`/`import` 構文を使用
- **バージョンパラメータ**: モジュールインポートに `?v=X.X.X` を含めてキャッシュ対策
- **GitHub Pages 互換**: 静的サイトとしてデプロイできるよう設計

---

## アーキテクチャとデザイン

### システムアーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
├─────────────────────────────────────────────────────────────┤
│  index.html (UI Layer)                                      │
│    ↓                                                         │
│  main.js (Entry Point)                                      │
│    ├── Imports all modules                                  │
│    ├── Registers functions to window (backward compat)      │
│    └── Initializes app on load                             │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
│  ┌──────────────┬──────────────┬──────────────┐            │
│  │ ui-utils.js  │ location-    │ weather-     │            │
│  │              │ service.js   │ service.js   │            │
│  └──────────────┴──────────────┴──────────────┘            │
│  ┌──────────────┬──────────────┐                           │
│  │ iss-service  │ astronomy-   │                           │
│  │ .js          │ service.js   │                           │
│  └──────────────┴──────────────┘                           │
├─────────────────────────────────────────────────────────────┤
│                    State Layer                               │
│  state.js (AppState object)                                 │
│    ├── location (lat, lon, favorites)                       │
│    ├── weather (data, selectedDatetime)                     │
│    ├── iss (tle, passes, notifications)                     │
│    └── ui (map, charts, intervals)                         │
├─────────────────────────────────────────────────────────────┤
│                   External APIs                              │
│  ├── Open-Meteo API (weather forecasts)                    │
│  ├── Nominatim API (reverse geocoding)                     │
│  └── CelesTrak API (ISS TLE data)                          │
└─────────────────────────────────────────────────────────────┘
```

### 設計原則

1. **サービス指向アーキテクチャ**: 各モジュールは特定のドメイン（気象、ISS、天文）を担当
2. **状態の一元管理**: すべてのアプリケーション状態は `AppState` オブジェクトに集約（グローバル変数の乱立を回避）
3. **機能分解**: 大きな関数を焦点を絞った単一目的の関数に分割
4. **後方互換性**: インラインHTMLイベントハンドラのために関数を `window` に公開
5. **キャッシュ管理**: 古いモジュールのロードを防ぐためインポートにバージョンパラメータを付与

### 大規模リファクタリング (v3.0.0)

バージョン3.0.0では、コードベースが**大規模なリファクタリング**を実施：

**変更前**: 単一の `functions.js` ファイル（約3,000行）に複数の責務が混在
**変更後**: 関心の分離が明確な5つのモジュール化されたサービスファイル

この変更は、既存のHTMLイベントハンドラとの**100%の後方互換性を維持**しながら実施されました。

---

## コード構成

### モジュール詳細

#### `state.js` - アプリケーション状態

**目的**: 状態管理の一元化

```javascript
export const AppState = {
    location: { lat, lon, favoriteLocations },
    weather: { data, selectedDatetime },
    iss: { tle, calculatedPasses, notificationInterval, ... },
    ui: { map, marker, charts, intervals }
};
```

**重要な規約**:
- 他のモジュールから必ずインポートする: `import { AppState } from './state.js?v=X.X.X';`
- 新しいグローバル変数を作成しない; 代わりに AppState に追加
- 永続化には `localStorage` を使用（お気に入り、ナイトビジョンモード）

---

#### `constants.js` - 静的データ

**目的**: 不変の参照データ

**エクスポート**:
- `METEOR_SHOWERS`: 主要な流星群とピーク日の配列
- `SEASONAL_OBJECTS`: 月齢別に分類された季節の天体

**規約**: すべての定数に `export const` を使用

---

#### `ui-utils.js` - 共通UI制御

**目的**: 共有UI機能

**主要関数**:
- `toggleAccordion(id)`: アコーディオンパネルの展開/折りたたみ
- `toggleNightVision()`: 赤色調のナイトモード切り替え
- `escapeHtml(text)`: ユーザー入力のサニタイズ（null/undefined ガード）
- `updateDateTime(datetime)`: datetime ピッカーとアプリ状態の同期

**規約**: DOM 操作以外の副作用を持たない純粋なユーティリティ関数

---

#### `location-service.js` - 位置情報管理

**目的**: 位置情報、地図、お気に入り

**主要関数**:
- `getCurrentLocation(isInitial)`: ブラウザの位置情報をリクエスト
- `updateAppLocation(lat, lon)`: 位置変更の中央ハンドラ
- `addFavoriteLocation()`: お気に入りに位置を保存（最大5件）
- `renderFavoriteLocations()`: お気に入り地点リストの表示
- `initMap()`: Leaflet 地図の初期化

**依存関係**:
- Leaflet.js: 地図レンダリング
- OpenStreetMap Nominatim: 逆ジオコーディング
- `localStorage`: お気に入りの永続化

**規約**: 位置を変更するすべての関数は `updateAppLocation()` を呼び出す

---

#### `weather-service.js` - 気象データとダッシュボード

**目的**: 気象データの取得とメインダッシュボードの描画

**主要関数**:
- `fetchWeather()`: Open-Meteo API から予報を取得
- `renderDashboard()`: すべてのダッシュボード要素の描画を統括
- `calculateStarryScore()`: 0-100 の視認性スコアを計算
- `renderRadarChart()`: 5軸レーダーチャートを描画（Chart.js）
- `renderTimeline()`: 24時間観測タイムラインを作成
- `renderTemperatureChart()`: 気温/湿度折れ線グラフ
- `renderCloudChart()`: 雲量層グラフ

**スコア計算アルゴリズム**:
```javascript
score = 雲量スコア(40%) + 月スコア(30%) + 湿度スコア(15%)
        + 視程スコア(10%) + 風速スコア(5%)
```

**規約**: 気象データは取得後 `AppState.weather.data` に保存

---

#### `iss-service.js` - ISS追跡

**目的**: ISS軌道計算とパス予測

**主要関数**:
- `updateISSInfo()`: CelesTrak から最新 TLE を取得（24時間キャッシュ）
- `calculateISSPasses()`: satellite.js を使用して7日間のパスを予測
- `drawISSSkymapCanvas(pass)`: ISS軌道付きの星座図を描画
- `checkISSNotifications()`: 接近パスを監視（1時間前警告）
- `requestNotificationPermission()`: ブラウザ通知権限をリクエスト

**TLE キャッシュ**:
- TLE データはタイムスタンプ付きで `localStorage` に保存
- 24時間以上経過した場合のみ更新（API呼び出しを削減）

**パス予測ロジック**:
1. 7日間、1分刻みでISS位置を計算
2. ECI → ECF → Look Angles（方位角、仰角）に変換
3. パスを検出: 仰角 > 0°（地平線上）
4. フィルタリング: 最大仰角 > 10° のパスのみ（観測可能）
5. `AppState.iss.calculatedPasses` に保存

**星座図座標変換**:
```javascript
// 方位角/高度 → Canvas (X, Y)
radius = ((90 - altitude) / 90) * maxRadius;
x = centerX + radius * sin(azimuth);
y = centerY - radius * cos(azimuth);
```

**規約**: 計算前に必ず TLE データの存在を確認

---

#### `astronomy-service.js` - 天文計算

**目的**: 天体イベント、惑星、天の川視認性

**主要関数**:
- `calculateSunMoonTimes()`: 日の出・日の入り、薄明時刻（Astronomy Engine）
- `calculateMoonData()`: 月相、月齢、照度
- `calculateMilkyWayVisibility()`: 銀河中心視認性スコア
- `updateAstronomicalEvents()`: 惑星位置、流星群の描画
- `calculateExposureSettings()`: 天体写真露出計算機

**天文薄明**:
- **市民薄明**: 太陽高度 -6°（明るい星が見える）
- **航海薄明**: 太陽高度 -12°（地平線がまだ見える）
- **天文薄明**: 太陽高度 -18°（真の暗闇、観測に最適）

**天の川視認性の要因**:
1. 月相（新月が望ましい）
2. 月の高度（低い方が良い）
3. 月と銀河中心の角距離
4. 雲量
5. 銀河中心の高度（地平線上である必要がある）

**規約**: すべての天体計算には Astronomy Engine ライブラリを使用

---

#### `main.js` - エントリーポイント

**目的**: アプリの初期化とモジュールのグローバルスコープへのブリッジ

**機能**:
1. すべてのサービスモジュールをインポート
2. すべてのエクスポートを `window` オブジェクトにマージ（HTML onclick ハンドラ用）
3. `AppState` を `window` に登録
4. Lucide アイコンを初期化
5. Moment.js のロケールを日本語に設定
6. localStorage からナイトビジョンモードを復元
7. 時計更新インターバルを開始
8. ページロード時にユーザーの位置を取得

**規約**: このファイルは最小限に保つ; ロジックはサービスモジュールに配置

---

### ES Module インポート規約

**キャッシュバスティングのため常にバージョンパラメータを使用**:

```javascript
import { AppState } from './state.js?v=3.1.5';
import * as weatherService from './weather-service.js?v=3.1.5';
```

**理由**: GitHub Pages と CDN は JS ファイルを積極的にキャッシュします。バージョンパラメータによりブラウザに新バージョンの取得を強制します。

**バージョン更新のタイミング**:
- すべてのリリース時に、すべてのモジュールインポートのバージョンを更新
- バージョンは README.md と CHANGELOG.md のバージョンと一致させる

---

## 開発ワークフロー

### ブランチ戦略

**ブランチ命名規則**: `claude/<機能説明>-<セッションID>`

例:
- `claude/refactor-js-modularize-Xsh2o`
- `claude/add-claude-documentation-NF21K`
- `claude/realtime-skymap-7UDHG`

**この規則の理由**:
- プレフィックス `claude/` は AI 支援開発を示す
- セッション ID はブランチ名の衝突を防止
- Git 操作はセキュリティのために一致するセッション ID を要求

### コミットメッセージスタイル

**言語**: 日本語
**形式**: セマンティック、説明的

過去の良い例:
```
ISS星座図のリアルタイム更新モードを実装し、パス予測切り替え機能を改善。バージョンを3.1.5に更新。
バージョンを3.1.3に更新。全モジュールのインポートにバージョンパラメータを追加し、リモート環境でのキャッシュ問題を解消。
escapeHtml関数にnull/undefinedガードを追加し、main.jsのキャッシュ対策としてバージョンパラメータを追加。バージョンを3.1.2に更新。
```

**コミットメッセージガイドライン**:
1. 日本語で記述
2. 主な変更から始め、その後補助的な変更をリスト
3. バージョンを上げた場合は必ず言及
4. 修正/追加/変更した内容を具体的に記述

### バージョニング（セマンティックバージョニング）

**形式**: `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): 破壊的変更、大規模リファクタリング（例: v3.0.0 モジュール化）
- **MINOR** (x.Y.0): 新機能、拡張（例: v2.11.0 露出計算機）
- **PATCH** (x.y.Z): バグ修正、小さな改善（例: v3.1.2 null ガード）

**更新すべきファイル**:
1. `README.md`（バッジとバージョンヘッダー）
2. `CHANGELOG.md`（先頭に新エントリを追加）
3. `docs/CHANGELOG.md`（同期を保つ）
4. JS ファイルのすべてのモジュールインポート（`?v=X.Y.Z` を更新）
5. docs/index.html(バージョン情報を更新)

### コミット前の必須チェックリスト

**重要**: すべてのコミット前に以下の手順を**必ず**実行してください。この手順を守らないと、キャッシュ問題やバージョン不整合が発生します。

#### 実行手順

**1. バージョンアップの判断と実施**
   - 変更内容に応じてバージョンを決定:
     - **PATCH** (x.y.Z): バグ修正、タイポ修正、小さな改善
     - **MINOR** (x.Y.0): 新機能追加、機能拡張
     - **MAJOR** (X.0.0): 破壊的変更、大規模リファクタリング

**2. 必須ファイルの更新（3箇所）**
   ```
   ✅ README.md
      - バージョン番号を更新（ヘッダーとバージョンバッジ）

   ✅ CHANGELOG.md
      - 先頭に新しいバージョンのエントリを追加
      - 変更内容を日本語で詳細に記載
      - フォーマット: "## [X.Y.Z] - YYYY-MM-DD"

   ✅ docs/CHANGELOG.md
      - CHANGELOG.md と同じ内容に同期
   ```

**3. モジュールインポートのバージョンパラメータ更新**

   以下のすべてのファイルで `?v=X.Y.Z` を新バージョンに更新:
   - `docs/main.js` - すべてのインポート文
   - `docs/weather-service.js` - すべてのインポート文
   - `docs/iss-service.js` - すべてのインポート文
   - `docs/astronomy-service.js` - すべてのインポート文
   - `docs/location-service.js` - すべてのインポート文
   - `docs/ui-utils.js` - すべてのインポート文（該当する場合）

   例:
   ```javascript
   // 旧: import { AppState } from './state.js?v=3.1.8';
   // 新: import { AppState } from './state.js?v=3.1.9';
   ```

**4. その他の更新箇所**
   ```
   ✅ docs/index.html
      - バージョン表示部分を更新（フッターなど）

   ✅ CLAUDE.md（本ファイル）
      - ヘッダーのバージョン情報を更新（行4）
   ```

**5. 更新確認**
   - [ ] すべてのファイルでバージョン番号が一致しているか
   - [ ] CHANGELOG.md に変更内容が記載されているか
   - [ ] モジュールインポートのバージョンパラメータが更新されているか
   - [ ] コミットメッセージを日本語で準備しているか

**6. コミット実行**
   - 説明的な日本語のコミットメッセージで変更をコミット
   - バージョンアップを含む場合は「バージョンをX.Y.Zに更新」を明記

#### チェックリスト例

変更内容: バグ修正の場合（PATCH: 3.1.8 → 3.1.9）

```
✅ バージョンを 3.1.9 に決定（バグ修正のため PATCH）
✅ README.md のバージョンを 3.1.9 に更新
✅ CHANGELOG.md に新エントリ追加（## [3.1.9] - 2026-01-17）
✅ docs/CHANGELOG.md を同期
✅ docs/main.js のインポートを ?v=3.1.9 に更新
✅ docs/weather-service.js のインポートを ?v=3.1.9 に更新
✅ docs/iss-service.js のインポートを ?v=3.1.9 に更新
✅ docs/astronomy-service.js のインポートを ?v=3.1.9 に更新
✅ docs/location-service.js のインポートを ?v=3.1.9 に更新
✅ docs/index.html のバージョン表示を更新
✅ CLAUDE.md のバージョンを 3.1.9 に更新
✅ コミットメッセージを準備: 「○○のバグを修正。バージョンを3.1.9に更新。」
✅ コミット実行
```

**注意**: このチェックリストを無視すると、本番環境で古いコードがキャッシュされ続け、ユーザーに更新が反映されない問題が発生します。

### プルリクエストワークフロー

**重要**: この環境では `gh` CLI が利用できません。`git` コマンドのみを使用してください。

1. **フィーチャーブランチで開発**（例: `claude/feature-name-ABC123`）
2. **変更をコミット**（説明的な日本語メッセージ）
3. **CHANGELOG.md を更新**（すべての変更を記載）
4. **バージョンを更新**（すべてのファイル）
5. **リモートにプッシュ**（`git push -u origin claude/feature-name-ABC123`）
6. **PR を作成**:
   - `gh` CLI は使用できないため、GitHub Web UI を使用
   - ブラウザで https://github.com/Masakai/weather_dashboard にアクセス
   - 「Compare & pull request」ボタンをクリック
   - または直接 URL を開く: `https://github.com/Masakai/weather_dashboard/compare/main...ブランチ名`
   - タイトルと説明を日本語で記述してPRを作成

---

## コーディング規約

### JavaScript スタイル

**ES6+ 機能**: モダンな JavaScript を使用
- アロー関数: `const func = () => {}`
- テンプレートリテラル: `` `Hello ${name}` ``
- 分割代入: `const { lat, lon } = AppState.location;`
- Async/await: 素の Promise より優先
- オプショナルチェーン: `obj?.prop?.nested`

**命名規則**:
- **関数**: camelCase（`calculateStarryScore`）
- **定数**: UPPER_SNAKE_CASE（`METEOR_SHOWERS`）
- **ファイル**: kebab-case（`weather-service.js`）
- **モジュール**: インポート時は camelCase（`weatherService`）

**セミコロンなし**: このプロジェクトはセミコロンを省略（ASI - 自動セミコロン挿入）

**コメント**:
- ユーザー向けロジックは日本語
- 技術的/アルゴリズム的コメントは英語
- 複雑な関数には JSDoc スタイルのコメント

### HTML 規約

**構造**:
- TailwindCSS ユーティリティクラスを広範に使用
- グラスモーフィズムデザインパターン（`.glass-panel`）
- レスポンシブブレークポイント: `md:`, `lg:` プレフィックス

**イベントハンドラ**:
- インラインハンドラも許容（レガシー互換性）
- 例: `onclick="toggleAccordion('iss-panel')"`

**アクセシビリティ**:
- セマンティック HTML を使用（`<section>`, `<header>`, `<main>`）
- Lucide アイコンに aria ラベル

### CSS 規約

**ナイトビジョンモード**:
```css
body.night-vision {
    filter: hue-rotate(180deg) invert(1);
    background: #300000 !important;
}
```

**カスタムスタイル**:
- `index.html` の `<style>` タグ内で定義
- 最小限のカスタム CSS（TailwindCSS を活用）

### エラーハンドリング

**ベストプラクティス**:
1. 常に null/undefined を検証（例: `escapeHtml` 関数）
2. API 失敗時のグレースフルなフォールバック
3. デバッグ用のコンソールエラー（ユーザー向けではない）
4. ユーザーフレンドリーなエラーメッセージは日本語

**例**:
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data;
} catch (error) {
    console.error('Weather fetch failed:', error);
    alert('天気データの取得に失敗しました');
    return null;
}
```

---

## 技術スタック

### コアテクノロジー

| 技術 | バージョン | 用途 |
|------|-----------|------|
| **HTML5** | - | 構造 |
| **CSS3** | - | スタイリング |
| **JavaScript** | ES6+ | ロジック |
| **TailwindCSS** | latest (CDN) | ユーティリティファースト CSS フレームワーク |

### ライブラリ（CDN）

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| [Chart.js](https://www.chartjs.org/) | 4.4.1 | 気温、雲量、レーダーチャート |
| [Moment.js](https://momentjs.com/) | 2.29.4 | 日時操作、日本語ロケール |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | インタラクティブ地図 |
| [Lucide Icons](https://lucide.dev/) | latest | アイコンライブラリ |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | 2.1.19 | 惑星位置、薄明計算 |
| [Satellite.js](https://github.com/shashwatak/satellite-js) | 5.0.0 | ISS 軌道計算（TLE 伝播） |

### 外部 API

| API | レート制限 | 用途 | ドキュメント |
|-----|----------|------|------------|
| **Open-Meteo** | 寛容（無料） | 気象予報（時間別、日別） | [open-meteo.com](https://open-meteo.com/) |
| **Nominatim** | 1 req/秒 | 逆ジオコーディング（座標 → 住所） | [nominatim.org](https://nominatim.openstreetmap.org/) |
| **CelesTrak** | 厳格な制限なし | ISS TLE データ（24時間キャッシュ） | [celestrak.org](https://celestrak.org/) |

**API ガイドライン**:
- レート制限を常にグレースフルに処理
- 可能な場合はレスポンスをキャッシュ（TLE キャッシュの例）
- API 失敗時にユーザーフィードバックを提供

---

## ファイルリファレンス

### クイックリファレンス

| ファイル | 行数 | 目的 | 主なエクスポート |
|---------|-----|------|----------------|
| `index.html` | ~1200 | メインUI | - |
| `main.js` | ~52 | エントリーポイント | - |
| `state.js` | ~35 | 状態管理 | `AppState` |
| `constants.js` | ~66 | 静的データ | `METEOR_SHOWERS`, `SEASONAL_OBJECTS` |
| `ui-utils.js` | ~100 | UI ユーティリティ | `toggleAccordion`, `toggleNightVision`, `escapeHtml` |
| `location-service.js` | ~300 | 位置情報/地図 | `getCurrentLocation`, `updateAppLocation`, `initMap` |
| `weather-service.js` | ~800 | 気象/ダッシュボード | `fetchWeather`, `renderDashboard`, `calculateStarryScore` |
| `iss-service.js` | ~700 | ISS 追跡 | `updateISSInfo`, `calculateISSPasses`, `drawISSSkymapCanvas` |
| `astronomy-service.js` | ~600 | 天文イベント | `calculateSunMoonTimes`, `updateAstronomicalEvents` |

### ドキュメントファイル

| ファイル | 目的 |
|---------|------|
| `README.md` | ユーザー向けドキュメント（日本語） |
| `CHANGELOG.md` | バージョン履歴（Keep a Changelog 形式） |
| `docs/internal_spec.md` | 技術仕様書（日本語） |
| `CLAUDE.md` | 本ファイル - AI 支援開発ガイド |

---

## よくある開発タスク

### 新機能の追加

1. **どのサービスモジュールに属するか決定**:
   - UI 関連 → `ui-utils.js`
   - 位置情報/地図 → `location-service.js`
   - 気象 → `weather-service.js`
   - ISS → `iss-service.js`
   - 天文 → `astronomy-service.js`

2. **適切なモジュールに関数を記述**:
   ```javascript
   export function myNewFeature() {
       // 実装
   }
   ```

3. **状態が必要な場合**、`state.js` の `AppState` に追加

4. **静的データを使用する場合**、`constants.js` に追加

5. **テスト**（ブラウザコンソールまたはHTMLから呼び出し）

6. **CHANGELOG.md を更新**

7. **バージョンを上げて**インポートを更新

### バグ修正

1. **バグを特定**（ブラウザコンソールでエラーを確認）

2. **責任のあるモジュールを特定**

3. **問題を修正**:
   - データが欠落している可能性がある場合は null チェックを追加
   - API レスポンスを検証
   - エッジケースを処理

4. **徹底的にテスト**:
   - 異なる場所
   - 異なる時刻/日付
   - エッジケース（null データ、API 失敗）

5. **CHANGELOG.md を更新**（`### Fixed` の下に記載）

6. **PATCH バージョンを上げる**（例: 3.1.2 → 3.1.3）

### 依存関係の更新

**CDN ライブラリ**: `index.html` の `<script>` タグ内のバージョンを更新

例:
```html
<!-- 旧 -->
<script src="https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.18/..."></script>

<!-- 新 -->
<script src="https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/..."></script>
```

**テスト**: 更新後は常に重要なパスをテスト

### リファクタリング

**ガイドライン**:
1. **後方互換性を維持**（メジャーバージョンアップ以外）
2. **関数を window スコープに保持**（HTML イベントハンドラ用）
3. **モジュール間でコードを移動する場合はすべてのインポートを更新**
4. **完全なリグレッションテストを実行**

**最近の例**: v3.0.0 リファクタリング
- 3000行のファイルを5つのモジュールに分割
- 100% の後方互換性を維持
- すべてのインポートにバージョンパラメータを更新

---

## AI支援開発のための重要な注意事項

### 重要なルール

1. **JS ファイルを変更する際は必ずバージョンパラメータを更新**:
   ```javascript
   import { AppState } from './state.js?v=3.1.5';  // これを更新！
   ```

2. **日本語を維持**する対象:
   - コミットメッセージ
   - CHANGELOG のエントリ
   - ユーザー向けコメント
   - ユーザーに表示するエラーメッセージ

3. **後方互換性を絶対に破らない**（メジャーバージョンアップ以外）:
   - 関数を `window` スコープに保持（エクスポートもしている場合でも）
   - パブリック関数を削除または名前変更しない

4. **セマンティックバージョニングを厳格に守る**:
   - PATCH: バグ修正、タイポ、小さな改善
   - MINOR: 新機能、拡張
   - MAJOR: 破壊的変更、アーキテクチャリファクタリング

5. **3か所のバージョンをすべて更新**:
   - `README.md`（ヘッダーとバッジ）
   - `CHANGELOG.md`（先頭に新エントリを追加）
   - モジュールインポート（すべての `?v=X.Y.Z`）

### キャッシュバスティング戦略

**問題**: ブラウザと CDN は JavaScript モジュールを積極的にキャッシュする

**解決策**: すべてのインポートにバージョンクエリパラメータ

**例**:
```javascript
// main.js
import { AppState } from './state.js?v=3.1.5';
import * as uiUtils from './ui-utils.js?v=3.1.5';
import * as locationService from './location-service.js?v=3.1.5';
// ... バージョン変更時にすべてのインポートを更新
```

**更新タイミング**: 変更を即座に反映する必要がある場合は毎回（ほぼ常に）

### テストチェックリスト

変更をコミットする前に:

- [ ] 異なるブラウザでテスト（Chrome、Firefox、Safari）
- [ ] レスポンシブデザインをテスト（モバイル、タブレット、デスクトップ）
- [ ] 異なる場所でテスト（東京、ロンドン、ニューヨーク）
- [ ] ISS パス予測をテスト（7日以内に結果が表示されるはず）
- [ ] ナイトビジョンモード切り替えをテスト
- [ ] お気に入り地点をテスト（追加、削除、読み込み）
- [ ] ブラウザコンソールでエラーを確認
- [ ] すべてのチャートが正しく描画されることを確認
- [ ] datetime ピッカーをテスト（過去、現在、未来の日付）
- [ ] CHANGELOG.md が更新されていることを確認
- [ ] すべてのファイルでバージョン番号が一致することを確認

### よくある落とし穴

1. **バージョンパラメータの忘れ**: 古いコードがキャッシュされる原因
2. **HTML イベントハンドラの破壊**: window スコープに依存している
3. **null/undefined の処理忘れ**: API は失敗したり不完全なデータを返すことがある
4. **日付のハードコーディング**: 日付計算には Moment.js を使用
5. **localStorage 制限の無視**: お気に入り地点は 5 件以下に
6. **API レート制限の無視**: Nominatim は 1 req/秒
7. **CHANGELOG の更新忘れ**: すべてのリリースにドキュメントが必要

### デバッグのヒント

**ブラウザコンソールコマンド**:
```javascript
// AppState を確認
console.log(AppState);

// 気象データを確認
console.log(AppState.weather.data);

// ISS パスを確認
console.log(AppState.iss.calculatedPasses);

// 気象データの強制更新
fetchWeather();

// ISS 情報の強制更新
updateISSInfo();
```

**よくある問題**:
- **ISS パスが表示されない**: TLE データが読み込まれているか確認（`AppState.iss.tle`）
- **チャートが描画されない**: Chart.js が読み込まれているか、データが null でないか確認
- **位置が更新されない**: 位置情報の権限を確認
- **古い JavaScript**: ブラウザキャッシュをクリア、バージョンパラメータを確認

### パフォーマンスの考慮事項

1. **API 呼び出しを最小化**:
   - TLE データをキャッシュ（24時間）
   - 地図操作をデバウンス
   - 異なる可視化に気象データを再利用

2. **Canvas 描画**:
   - 必要な時のみ星座図を再描画
   - コンポーネントアンマウント時にインターバルをクリア

3. **メモリリーク**:
   - インターバルをクリア: `clearInterval(AppState.ui.skymapUpdateInterval)`
   - 再作成前にチャートを破棄: `chart.destroy()`

### アクセシビリティ

**現状**: 基本的なアクセシビリティを実装済み

**改善が必要な点**:
- すべてのインタラクティブ要素に ARIA ラベルを追加
- 地図のキーボードナビゲーション
- チャートのスクリーンリーダーサポート（代替テキスト、データテーブル）
- ハイコントラストモードのサポート

**色覚異常への配慮**: ナイトビジョンモードは有用だが、追加モードも検討を

---

## バージョン履歴ハイライト

### v3.1.6 (2026-01-17)
- Google Analytics 4（GA4）によるアクセス統計機能の追加

### v3.1.5 (2026-01-17)
- ISS 星座図のリアルタイム更新モード
- パス予測切り替え機能の改善

### v3.1.3 (2026-01-17)
- すべてのファイルでモジュールインポートのバージョンパラメータを追加
- ISS 軌道計算のタイムアウトと非同期処理の改善

### v3.0.0 (2026-01-17) - 大規模リファクタリング
- モノリシックな `functions.js` を5つのサービスモジュールに分割
- ES Modules アーキテクチャの導入
- 状態管理の一元化（`AppState`）
- 100% の後方互換性を維持

### v2.14.0 (2026-01-17)
- 雲量データを反映した夜間観測タイムライン
- 雲密度に基づく4段階の色分け

### v2.12.0 (2026-01-16)
- ISS 通過通知（1時間前警告）
- ブラウザとアプリ内バナー通知

### v2.11.0 (2026-01-16)
- 天体写真露出計算機
- 500ルール + NPF 方式の実装

### v2.10.0 (2026-01-16)
- 大気透明度とシーイング指標
- 観測タイプ別アドバイス

---

## 連絡先とサポート

**プロジェクトリポジトリ**: [github.com/Masakai/weather_dashboard](https://github.com/Masakai/weather_dashboard)

**開発元**: 株式会社リバーランズ・コンサルティング

**ライセンス**: MIT License

---

## 今後の AI 支援開発者へ

このプロジェクトで作業する際は:

1. **変更を加える前にこのファイルを読む**
2. **モジュール構造を理解する** - ランダムなファイルにコードを追加しない
3. **日本語要件を尊重する** - コミットメッセージ、ユーザー向けテキスト
4. **徹底的にテストする** - これはユーザー向けアプリケーション
5. **変更を文書化する** - CHANGELOG.md を更新
6. **適切にバージョニング** - セマンティックバージョニングは必須
7. **キャッシュを意識する** - 常にバージョンパラメータを更新
8. **品質を維持する** - これは実際の天体観測者が使用する本番コード

**忘れずに**: このアプリケーションは、人々が夜空の神秘を体験する手助けをしています。細心の注意を払って扱ってください。

---

**Happy coding! 🌟**

*最終更新: 2026-01-17 by Claude (AI Assistant)*
