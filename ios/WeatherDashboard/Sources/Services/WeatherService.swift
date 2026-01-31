import Foundation

final class WeatherService {
    private let apiClient = APIClient()

    func fetchWeather(lat: Double, lon: Double) async throws -> WeatherResponse {
        let url = "https://api.open-meteo.com/v1/forecast?latitude=\(lat)&longitude=\(lon)&hourly=temperature_2m,relative_humidity_2m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,windspeed_10m,winddirection_10m,surface_pressure,dewpoint_2m,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FTokyo&past_days=2&forecast_days=10"
        return try await apiClient.fetch(url)
    }

    func snapshot(from response: WeatherResponse, targetDate: Date) -> WeatherSnapshot? {
        let times = response.hourly.time
        guard !times.isEmpty else { return nil }
        let target = targetDate
        var closestIndex = 0
        var minDiff = Double.greatestFiniteMagnitude
        for (index, timeString) in times.enumerated() {
            guard let date = DateHelpers.parseDateTime(timeString) else { continue }
            let diff = abs(date.timeIntervalSince(target))
            if diff < minDiff {
                minDiff = diff
                closestIndex = index
            }
        }
        return WeatherSnapshot(
            date: target,
            temperature: response.hourly.temperature_2m[closestIndex],
            cloudCover: response.hourly.cloud_cover[closestIndex],
            cloudLow: response.hourly.cloud_cover_low[closestIndex],
            cloudMid: response.hourly.cloud_cover_mid[closestIndex],
            cloudHigh: response.hourly.cloud_cover_high[closestIndex],
            humidity: response.hourly.relative_humidity_2m[closestIndex],
            windSpeed: response.hourly.windspeed_10m[closestIndex],
            windDirection: response.hourly.winddirection_10m[closestIndex],
            visibility: response.hourly.visibility[closestIndex]
        )
    }

    func dailySummary(from response: WeatherResponse, targetDate: Date) -> (max: Double, min: Double, code: Int)? {
        let dayStrings = response.daily.time
        for (index, day) in dayStrings.enumerated() {
            if let date = DateHelpers.isoDate.date(from: day), Calendar.current.isDate(date, inSameDayAs: targetDate) {
                return (
                    max: response.daily.temperature_2m_max[index],
                    min: response.daily.temperature_2m_min[index],
                    code: response.daily.weathercode[index]
                )
            }
        }
        return nil
    }
}

enum WeatherCodeMapper {
    static func map(_ code: Int) -> WeatherSummary {
        switch code {
        case 0:
            return WeatherSummary(label: "快晴", symbolName: "sun.max.fill", accentColorName: "orange")
        case 1...3:
            return WeatherSummary(label: "曇り・晴れ間", symbolName: "cloud.sun.fill", accentColorName: "gray")
        case 45...48:
            return WeatherSummary(label: "霧", symbolName: "cloud.fog.fill", accentColorName: "gray")
        case 51...55:
            return WeatherSummary(label: "霧雨", symbolName: "cloud.drizzle.fill", accentColorName: "blue")
        case 61...67:
            return WeatherSummary(label: "雨", symbolName: "cloud.rain.fill", accentColorName: "blue")
        case 71...77:
            return WeatherSummary(label: "雪", symbolName: "snowflake", accentColorName: "white")
        case 80...82:
            return WeatherSummary(label: "にわか雨", symbolName: "cloud.heavyrain.fill", accentColorName: "blue")
        case 95...99:
            return WeatherSummary(label: "雷雨", symbolName: "cloud.bolt.rain.fill", accentColorName: "yellow")
        default:
            return WeatherSummary(label: "不明", symbolName: "questionmark.circle", accentColorName: "gray")
        }
    }
}
