import Foundation

enum StarryScoreCalculator {
    static func calculate(cloudCover: Double, moonAge: Double, humidity: Double, visibility: Double = 24, windSpeed: Double = 5) -> Int {
        let cloudScore = max(0, 100 - cloudCover)
        let moonScore: Double
        if moonAge < 3 || moonAge > 26 {
            moonScore = 100
        } else if moonAge < 10 || moonAge > 18 {
            moonScore = 60
        } else {
            moonScore = 20
        }
        let humidityScore = max(0, 100 - humidity)
        let visibilityScore = min(100, (visibility / 50) * 100)
        let windScore: Double
        if windSpeed < 2 {
            windScore = 100
        } else if windSpeed < 5 {
            windScore = 80
        } else if windSpeed < 10 {
            windScore = 50
        } else {
            windScore = 20
        }
        let total = (cloudScore * 0.4 + moonScore * 0.3 + humidityScore * 0.15 + visibilityScore * 0.1 + windScore * 0.05)
        return Int(round(total))
    }

    static func comment(for score: Int) -> String {
        switch score {
        case 80...:
            return "⭐ 絶好の観測日和！星空が最高に美しく見えるでしょう"
        case 60..<80:
            return "✨ 観測に適した条件です。良い星空が期待できます"
        case 40..<60:
            return "🌤️ まずまずの条件。明るい星は観測できます"
        case 20..<40:
            return "☁️ やや条件が悪いです。観測には忍耐が必要かも"
        default:
            return "☁️ 観測には不向きな条件です。空は雲に覆われています"
        }
    }
}
