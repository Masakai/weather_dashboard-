import Foundation

struct WeatherResponse: Codable {
    let hourly: HourlyWeather
    let daily: DailyWeather

    struct HourlyWeather: Codable {
        let time: [String]
        let temperature_2m: [Double]
        let relative_humidity_2m: [Double]
        let cloud_cover: [Double]
        let cloud_cover_low: [Double]
        let cloud_cover_mid: [Double]
        let cloud_cover_high: [Double]
        let windspeed_10m: [Double]
        let winddirection_10m: [Double]
        let surface_pressure: [Double]
        let dewpoint_2m: [Double]
        let visibility: [Double]
    }

    struct DailyWeather: Codable {
        let time: [String]
        let weathercode: [Int]
        let temperature_2m_max: [Double]
        let temperature_2m_min: [Double]
        let precipitation_sum: [Double]
        let precipitation_probability_max: [Double]
        let sunrise: [String]
        let sunset: [String]
    }
}

struct WeatherSnapshot {
    let date: Date
    let temperature: Double
    let cloudCover: Double
    let cloudLow: Double
    let cloudMid: Double
    let cloudHigh: Double
    let humidity: Double
    let windSpeed: Double
    let windDirection: Double
    let visibility: Double
}

struct WeatherSummary {
    let label: String
    let symbolName: String
    let accentColorName: String
}

extension WeatherResponse {
    static let preview = WeatherResponse(
        hourly: WeatherResponse.HourlyWeather(
            time: ["2025-01-20T12:00"],
            temperature_2m: [6.0],
            relative_humidity_2m: [45],
            cloud_cover: [10],
            cloud_cover_low: [5],
            cloud_cover_mid: [8],
            cloud_cover_high: [12],
            windspeed_10m: [4],
            winddirection_10m: [120],
            surface_pressure: [1015],
            dewpoint_2m: [1],
            visibility: [20]
        ),
        daily: WeatherResponse.DailyWeather(
            time: ["2025-01-20"],
            weathercode: [0],
            temperature_2m_max: [10],
            temperature_2m_min: [2],
            precipitation_sum: [0],
            precipitation_probability_max: [0],
            sunrise: ["2025-01-20T06:45"],
            sunset: ["2025-01-20T17:10"]
        )
    )
}
