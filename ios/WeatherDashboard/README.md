# WeatherDashboard iOS (SwiftUI)

## 生成手順
1. XcodeGenをインストール（未導入の場合）
2. このフォルダで `xcodegen generate` を実行
3. 生成された `WeatherDashboard.xcodeproj` をXcodeで開く

## 依存
- iOS 16+
- Swift Charts
- SwiftAA（惑星可視計算）

## 現状
- Open-Meteo/Nominatim/MET Norway Sunrise APIから取得
- ISS情報は `wheretheiss.at` と `open-notify.org` を使用（パス取得はフォールバックあり）
- 天文時刻はMET Norway API、惑星可視はSwiftAAで算出

必要に応じて、天文/ISS計算の精度向上やMapKit画面を追加します。
