# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2026-01-15

### Fixed
- 日時選択機能の時間変更ができない問題を修正
- datetime-local inputにstep="900"属性を追加し、15分刻みでの時間変更を可能に
- 日付と時刻の両方を確実に変更できるように改善

### Changed
- datetime-local inputにtitle属性を追加してユーザビリティを向上

## [2.3.0] - 2026-01-15

### Added
- TLEベースのISS追跡機能を実装（satellite.jsライブラリを使用）
- CelesTrakからリアルタイムでISSのTLEデータを自動取得
- ISS可視予報機能を追加（観測地点からの可視性を計算）
- 天体イベント情報セクションにアコーディオン表示を実装
- 4つのパネル（ISS、惑星、流星群、推奨天体）を個別に展開/折りたたみ可能に

### Changed
- 不安定なOpen Notify APIからTLEベースの計算方式に変更
- 天体イベント情報のレイアウトを縦積みアコーディオン形式に変更
- デフォルトで全パネルを折りたたみ状態にし、省スペース化を実現
- satellite.js v5.0.0をCDN経由で読み込み

## [2.2.1] - 2026-01-15

### Removed
- Open Notify API依存のISS現在位置機能を削除（API不安定のため）
- ISS乗員情報機能を削除（API不安定のため）

## [2.2.0] - 2026-01-15

### Added
- ISS現在位置表示機能（Open Notify API使用）
- リアルタイムISS位置情報（緯度・経度・タイムスタンプ）の表示

### Changed
- ISS通過予報からISS現在位置表示に機能を移行
- Open Notify API エンドポイントを /iss-pass.json から /iss-now.json に変更

## [2.1.0] - 2026-01-14

### Added
- ISS乗員情報表示機能（Open Notify API使用）
- 現在ISSに滞在中の宇宙飛行士の人数と名前をリアルタイム表示
- Open Notify API の /astros.json エンドポイントを統合

## [2.0.0] - 2026-01-14

### Added
- 星空視認性スコア機能（雲量・月明かり・湿度・視程・風速を総合評価）
- 追加気象データ（風速・風向・気圧・露点・視程）の表示
- 天文薄明・日月出没時刻表示機能
- 24時間観測適性タイムライン
- ナイトビジョンモード（赤色表示で暗順応を妨げない）
- お気に入り地点機能（最大5件登録可能）
- 観測適性レーダーチャート
- 天体イベント情報セクション（惑星・流星群・推奨天体）

### Changed
- UIを大幅に刷新し、天体観測に特化したダッシュボードに変更

## [1.5.3] - 2026-01-13

### Removed
- 月の出データを削除

### Changed
- バージョン番号を復元

## [1.5.1] - 日付不明

### Added
- 日時指定機能
- 週間予報クリック機能

## [1.0.0] - 日付不明

### Added
- 初回リリース
- 基本的な天気ダッシュボード機能
- 気温・雲量の表示
- 週間予報機能
