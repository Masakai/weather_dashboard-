# 🌟 天体観測できるかな？

**バージョン 2.1.0**

天体観測に最適な条件を総合判定する、インタラクティブな気象ダッシュボードです。雲量・月明かり・湿度・視程・風速などを総合的に評価し、星空観測の成功率を高めます。

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 目次

- [特徴](#-特徴)
- [デモ](#-デモ)
- [主要機能](#-主要機能)
- [技術スタック](#-技術スタック)
- [セットアップ](#-セットアップ)
- [使い方](#-使い方)
- [API情報](#-api情報)
- [バージョン履歴](#-バージョン履歴)
- [ライセンス](#-ライセンス)

---

## ✨ 特徴

- **🎯 星空視認性スコア**: 複数の気象要素を総合評価し、0-100点でスコア化
- **🌙 天文薄明時刻表示**: 本格観測の開始・終了時刻を高精度計算
- **📊 24時間タイムライン**: 観測適性を時間帯ごとに可視化
- **🌍 地図連携**: クリック一つで任意の地点の気象情報を取得
- **💾 お気に入り地点**: 最大5地点を登録して瞬時に切り替え
- **🔴 ナイトビジョンモード**: 赤色表示で暗順応を妨げない
- **📱 レスポンシブデザイン**: PC・タブレット・スマートフォンに対応

---

## 🎬 デモ

`docs/index.html` をブラウザで開くだけで動作します。

```bash
# リポジトリをクローン
git clone https://github.com/Masakai/weather_dashboard.git

# ディレクトリに移動
cd weather_dashboard

# HTMLを開く
open docs/index.html
# または
firefox docs/index.html
```

---

## 🚀 主要機能

### 1. 星空視認性スコア ⭐

雲量・月明かり・湿度・視程・風速を加重平均で総合評価。

**計算式:**
```
スコア = 雲量(40%) + 月明かり(30%) + 湿度(15%) + 視程(10%) + 風速(5%)
```

**評価基準:**
- 80点以上: ⭐ 絶好の観測日和
- 60-79点: ✨ 観測に適した条件
- 40-59点: 🌤️ まずまずの条件
- 20-39点: ☁️ やや条件が悪い
- 20点未満: ❌ 観測には不向き

### 2. 詳細気象データ 🌡️

| データ項目 | 用途 |
|-----------|------|
| **風速・風向** | 望遠鏡の安定性評価 |
| **露点温度** | レンズ結露リスク判定 |
| **気圧** | 天候変化の予測 |
| **視程** | 空気の澄み具合 |

**結露リスク判定:**
- 気温 - 露点 < 2°C: ⚠️ 結露リスク高
- 気温 - 露点 2-5°C: ⚡ 結露注意
- 気温 - 露点 > 5°C: ✅ 結露リスク低

### 3. 天文薄明・日月出没時刻 🌅

astronomy-engine.jsによる高精度計算:
- **天文薄明開始** (太陽高度 -18°)
- **日の出**
- **日の入**
- **天文薄明終了** (本格観測開始時刻)
- **月の出 / 月の入**

### 4. 24時間観測適性タイムライン 📊

時間帯を色分けして表示:
- 🟡 **黄色**: 日中
- 🔵 **青色**: 薄明 (観測準備時間)
- 🟢 **緑色**: 観測適時 (本格観測時間)

### 5. ナイトビジョンモード 🌙

- 赤色表示で暗順応を妨げない
- ワンクリックで切り替え
- localStorage で設定を記憶

### 6. お気に入り地点機能 📍

- 最大5地点まで登録可能
- 地点名・緯度・経度を保存
- ワンクリックで地点切り替え

### 7. 観測適性レーダーチャート 🎯

5つの評価軸を可視化:
1. 雲の少なさ
2. 月の暗さ
3. 低湿度
4. 高視程
5. 風の穏やかさ

### 8. 天体イベント情報 🌟

#### 8-1. 今夜見える惑星 🪐
- 水星・金星・火星・木星・土星
- 高度・方位・等級をリアルタイム表示

#### 8-2. 流星群カレンダー ☄️
- 主要8流星群を網羅
- 極大日は特別ハイライト
- 前後30日以内の流星群を自動表示

#### 8-3. ISS通過予報 🛰️
- Open Notify API でリアルタイム取得
- 次の3回の通過時刻と継続時間

#### 8-4. ISS乗員情報 👨‍🚀
- 現在ISSに滞在中の宇宙飛行士の人数を表示
- 各宇宙飛行士の名前と所属をリアルタイム表示
- Open Notify API の /astros.json エンドポイントを使用

#### 8-5. 月齢による観測推奨天体 🔭
- **新月期**: アンドロメダ銀河、オリオン大星雲など
- **満月期**: 月面地形観測
- **上弦/下弦**: 月面クレーター、惑星

---

## 🛠️ 技術スタック

### フロントエンド
- **HTML5** / **CSS3** (TailwindCSS)
- **JavaScript** (Vanilla JS)

### ライブラリ
| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| [astronomy-engine.js](https://github.com/cosinekitty/astronomy) | 2.1.19 | 惑星位置・天文薄明計算 |
| [Chart.js](https://www.chartjs.org/) | latest | グラフ描画 |
| [Moment.js](https://momentjs.com/) | 2.29.4 | 日時操作 |
| [Leaflet](https://leafletjs.com/) | 1.9.4 | 地図表示 |
| [Lucide Icons](https://lucide.dev/) | latest | アイコン |

### API
| API | 用途 |
|-----|------|
| [Open-Meteo](https://open-meteo.com/) | 気象データ取得 |
| [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) | 逆ジオコーディング |
| [Open Notify](http://open-notify.org/) | ISS通過予報 |

---

## 📦 セットアップ

### 必要な環境
- モダンなWebブラウザ (Chrome, Firefox, Safari, Edge)
- インターネット接続 (CDN経由でライブラリを読み込むため)

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/Masakai/weather_dashboard.git

# ディレクトリに移動
cd weather_dashboard

# ブラウザで開く
open docs/index.html
```

**または、ローカルサーバーを起動:**

```bash
# Python 3の場合
python -m http.server 8000

# ブラウザで http://localhost:8000/docs/index.html を開く
```

---

## 📖 使い方

### 基本操作

1. **位置情報の設定**
   - 初回アクセス時に現在地の取得を許可
   - または「地図で場所を変更」から手動で選択

2. **日時の指定**
   - コントロールバーから任意の日時を選択
   - 「現在に戻す」ボタンで現在時刻に戻る

3. **スコアの確認**
   - 星空視認性スコアで観測適性を一目で判断
   - レーダーチャートで詳細な要素を確認

4. **お気に入り地点の登録**
   - 「お気に入りに追加」ボタンをクリック
   - 地点名を入力して保存

5. **ナイトビジョンモード**
   - ヘッダー右上の月アイコンをクリック
   - 赤色表示に切り替わる

### 週間予報の活用

- 週間予報テーブルの日付をクリック
- その日の詳細データが自動表示
- 月齢・雲量・湿度を一覧で比較

---

## 🌐 API情報

### Open-Meteo API

**取得パラメータ:**
```
hourly=temperature_2m,relative_humidity_2m,cloud_cover,
       cloud_cover_low,cloud_cover_mid,cloud_cover_high,
       windspeed_10m,winddirection_10m,surface_pressure,
       dewpoint_2m,visibility

daily=weathercode,temperature_2m_max,temperature_2m_min,
      precipitation_sum,precipitation_probability_max,
      sunrise,sunset
```

**制限:**
- 無料プラン: 10,000リクエスト/日
- レート制限: なし

### Open Notify API

**エンドポイント:**
```
http://api.open-notify.org/iss-pass.json?lat={lat}&lon={lon}&n=5
```

**制限:**
- レート制限: なし

---

## 📝 バージョン履歴

### v2.1.0 (2026-01-14)
**マイナーアップデート**

- ✨ ISS乗員情報表示機能追加
- 📊 現在ISSに滞在中の宇宙飛行士の人数と名前をリアルタイム表示
- 🛰️ Open Notify API の /astros.json エンドポイント統合

### v2.0.0 (2026-01-14)
**メジャーアップデート**

- ✨ 星空視認性スコア追加
- ✨ 追加気象データ (風速・風向・気圧・露点・視程)
- ✨ 天文薄明・日月出没時刻表示
- ✨ 24時間観測適性タイムライン
- ✨ ナイトビジョンモード
- ✨ お気に入り地点機能 (最大5件)
- ✨ 観測適性レーダーチャート
- ✨ 天体イベント情報 (4項目)

### v1.5.3 (2026-01-13)
- 🐛 月の出データを削除
- 🔄 バージョン復元

### v1.5.1
- ✨ 日時指定機能追加
- ✨ 週間予報クリック機能

### v1.0.0
- 🎉 初回リリース

---

## 🤝 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

---

## 🙏 謝辞

- [Open-Meteo](https://open-meteo.com/) - 無料の気象API
- [OpenStreetMap](https://www.openstreetmap.org/) - 地図データ
- [astronomy-engine.js](https://github.com/cosinekitty/astronomy) - 天文計算ライブラリ
- [Chart.js](https://www.chartjs.org/) - グラフ描画ライブラリ
- [Lucide Icons](https://lucide.dev/) - 美しいアイコンセット

---

## 📧 連絡先

プロジェクトリンク: [https://github.com/Masakai/weather_dashboard](https://github.com/Masakai/weather_dashboard)

---

**Happy Stargazing! 🌠**
