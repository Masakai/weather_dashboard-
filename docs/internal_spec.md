### 天体観測ダッシュボード 内部詳細仕様書

**株式会社リバーランズ・コンサルティング**

#### 1. システム概要
本アプリケーションは、天体観測に最適な条件をリアルタイムで判定・可視化するWebベースのダッシュボードである。気象データ、天体位置、人工衛星（ISS）の軌道情報を統合し、観測の成功率をスコア化して提供する。

#### 2. 技術スタック
- **Frontend**: HTML5, CSS3 (TailwindCSS), JavaScript (ES6+)
- **Libraries**:
  - `Moment.js`: 日時操作、ローカライズ
  - `Chart.js`: 気象データ（気温・雲量）のグラフ描画
  - `Leaflet.js`: 地図表示、観測地点選択
  - `Astronomy Engine`: 太陽・月・惑星の精密な位置計算
  - `Satellite.js`: ISSの軌道計算（TLEベース）
  - `Lucide Icons`: UIアイコン
- **External APIs**:
  - `Open-Meteo API`: 気象予報データ取得
  - `OpenStreetMap Nominatim`: 逆ジオコーディング
  - `CelesTrak`: ISSの最新TLEデータ取得

#### 3. 主要処理論理：関数レベル詳説

##### 3.1 星空視認性スコアリング
**関数:** `calculateStarryScore(cloudCover, moonAge, humidity, visibility, windSpeed)`

複数の気象パラメータを統合し、0〜100のスコアを算出する。各パラメータの重み付けと変換論理は以下の通り：

| パラメータ | 重み | 計算論理 | 説明 |
| :--- | :---: | :--- | :--- |
| **雲量** | 40% | `100 - 全雲量(%)` | 視界を遮る最大の要因として最重視。 |
| **月明かり** | 30% | 月齢による段階評価 | 新月付近(月齢<3, >26): 100点<br>半月付近: 60点<br>満月付近(10-18): 20点 |
| **湿度** | 15% | `100 - 湿度(%)` | 水蒸気が多いと大気が不透明になるため。 |
| **視程** | 10% | `min(100, (視程(km) / 50) * 100)` | 50km以上を100点として正規化。 |
| **風速** | 5% | 風速段階評価 | <2m/s: 100点, <5m: 80点, <10m: 50点, 10m以上: 20点（気流の安定性）。 |

##### 3.2 アプリケーション状態更新フロー
**関数:** `updateAppLocation(lat, lon)`

地点変更時にトリガーされる主要なエントリポイント。
1. `fetchAddress`: 地名を取得しUIを更新。
2. `updateMapMarker`: 地図上のピン位置を更新。
3. `fetchWeather`: 新しい座標の気象データをOpen-Meteoから非同期取得。
    - 取得後、`renderDashboard` を呼び出しUI全体を再描画。

##### 3.3 ISS軌道計算と通過予測
**関数:** `calculateISSPasses()`

`Satellite.js` を用いて、今後7日間のISS通過（パス）を予測する。

1. **TLE取得**: `updateISSInfo` にてCelesTrakから最新の2行軌道要素形式（TLE）データを取得。
2. **シミュレーション**: `now` から7日間、1分刻みのインターバルでループを回す。
3. **座標変換**:
    - `satellite.propagate`: 指定時刻のECI座標（地球中心慣性座標系）を算出。
    - `satellite.eciToEcf`: GMST（グリニッジ平均恒星時）を用いてECF座標（地球中心固定座標系）へ変換。
    - `satellite.ecfToLookAngles`: 観測者の緯度・経度に基づき、仰角(Elevation)・方位角(Azimuth)を算出。
4. **フィルタリング**: 仰角が0度を超えた時点を開始、0度を下回った時点を終了とし、その間の最大仰角が10度を超えるパスのみを抽出。

##### 3.4 インタラクティブ・スカイマップ（Canvas描画）
**関数:** `drawISSSkymapCanvas()`

Canvas APIを使用して、全天の天体位置を極座標投影法で描画する。

- **座標変換アルゴリズム (`azAltToCanvas`):**
    - 地平座標（方位角, 仰角）を、Canvas上の平面座標 (x, y) に変換する。
    - `radius = ((90 - altitude) / 90) * maxRadius` (天頂を半径0、地平線をmaxRadiusとする)
    - `x = centerX + radius * sin(azimuth)`
    - `y = centerY - radius * cos(azimuth)`
- **描画順序:**
    1. **グリッド**: 同心円（仰角）と放射線（方位角）を描画。
    2. **月・太陽**: `Astronomy Engine` で得た地平座標を変換して描画。月は月相（MoonPhase）に応じて欠け具合を表現（半円描画の組み合わせ）。
    3. **惑星**: 高度が0度以上の主要惑星を描画。
    4. **ISS経路**: パスが選択されている場合、開始から終了までの軌道を線で描画。

##### 3.5 太陽・月・天文イベント計算
**関数:** `calculateSunMoonTimes` / `updateAstronomicalEvents`

- **天文薄明**: `Astronomy Engine` を用い、太陽の高度が-18度になる時刻を算出。これが「真の暗闇」の基準となる。
- **天文イベント**: `Astronomy.Search` メソッドを用い、合（Conjunction）や最大離角などの天文現象を自動検索。

#### 4. 特殊機能の論理
- **ナイトビジョンモード**: `body.night-vision` クラスを付与し、CSSの `filter: hue-rotate(180deg) invert(1)` を適用。青色成分を除去し、赤色主体の表示にすることで、人間の目の暗順応（暗い場所に慣れた状態）を維持する。
- **データ永続化**: `localStorage` を使用し、お気に入り地点（最大5件）やナイトビジョンモードの設定をブラウザに保存。

#### 5. データフロー概略
```text
[ユーザー操作/現在地取得]
      ↓
[updateAppLocation] 
      ↓
[fetchWeather (Open-Meteo API)] ──→ [気象データ受信]
      ↓                                    ↓
[updateISSInfo (CelesTrak)]     ──→ [TLEデータ受信]
      ↓                                    ↓
[renderDashboard] ←────────────────────────┘
      ├─→ [calculateStarryScore] → スコア表示
      ├─→ [renderTimeline] → 24時間予報バー
      ├─→ [calculateISSPasses] → ISS通過リスト
      └─→ [drawISSSkymapCanvas] → スカイマップ描画
```

&copy; 2026 株式会社リバーランズ・コンサルティング
