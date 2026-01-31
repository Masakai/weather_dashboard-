import Foundation

#if canImport(SwiftAA)
import SwiftAA
#endif

final class AstronomyService {
    private let apiClient = APIClient()

    func fetchSummary(date: Date, lat: Double, lon: Double) async throws -> AstronomySummary {
        let day = DateHelpers.isoDate.string(from: date)
        let url = "https://api.met.no/weatherapi/sunrise/2.0/.json?lat=\(lat)&lon=\(lon)&date=\(day)&offset=+09:00"
        guard let requestUrl = URL(string: url) else { throw APIClient.APIError.invalidURL }
        var request = URLRequest(url: requestUrl)
        request.setValue("WeatherDashboard/1.0 (iOS)", forHTTPHeaderField: "User-Agent")
        let response: AstronomyAPIResponse = try await apiClient.fetch(request)
        let times = response.location.time.first

        let sunrise = times?.sunrise?.time.flatMap(DateHelpers.parseDateTime).map { DateHelpers.timeOnly.string(from: $0) } ?? "--:--"
        let sunset = times?.sunset?.time.flatMap(DateHelpers.parseDateTime).map { DateHelpers.timeOnly.string(from: $0) } ?? "--:--"
        let moonrise = times?.moonrise?.time.flatMap(DateHelpers.parseDateTime).map { DateHelpers.timeOnly.string(from: $0) } ?? "--:--"
        let moonset = times?.moonset?.time.flatMap(DateHelpers.parseDateTime).map { DateHelpers.timeOnly.string(from: $0) } ?? "--:--"

        let astroDawn = times?.astronomicalTwilightBegin?.time.flatMap(DateHelpers.parseDateTime).map { DateHelpers.timeOnly.string(from: $0) } ?? "--:--"
        let astroDusk = times?.astronomicalTwilightEnd?.time.flatMap(DateHelpers.parseDateTime).map { DateHelpers.timeOnly.string(from: $0) } ?? "--:--"

        let moonAge = MoonPhaseCalculator.age(on: date)
        let moonPhase = MoonPhaseCalculator.phaseName(for: moonAge)

        return AstronomySummary(
            sunrise: sunrise,
            sunset: sunset,
            observationStart: astroDusk,
            observationEnd: astroDawn,
            moonrise: moonrise,
            moonset: moonset,
            moonPhase: moonPhase,
            moonAge: String(format: "%.1f", moonAge),
            visiblePlanets: visiblePlanets(date: date, lat: lat, lon: lon)
        )
    }

    private func visiblePlanets(date: Date, lat: Double, lon: Double) -> [VisiblePlanet] {
        #if canImport(SwiftAA)
        let julianDay = JulianDay(date)
        let geo = GeographicCoordinates(positivelyWestwardLongitude: Degrees(-lon), latitude: Degrees(lat))
        let observer = Observer(geographicCoordinates: geo, altitude: Meters(0))

        let candidates: [(String, ApparentEquatorialCoordinates)] = [
            ("水星", Mercury(julianDay).apparentEquatorialCoordinates),
            ("金星", Venus(julianDay).apparentEquatorialCoordinates),
            ("火星", Mars(julianDay).apparentEquatorialCoordinates),
            ("木星", Jupiter(julianDay).apparentEquatorialCoordinates),
            ("土星", Saturn(julianDay).apparentEquatorialCoordinates)
        ]

        return candidates.compactMap { name, coordinates in
            let horizontal = coordinates.makeHorizontalCoordinates(for: observer, at: julianDay)
            let altitude = horizontal.altitude.inDegrees
            let isVisible = altitude > 0
            return VisiblePlanet(name: name, altitude: altitude, isVisible: isVisible)
        }
        #else
        return []
        #endif
    }
}

struct AstronomyAPIResponse: Codable {
    let location: AstronomyLocation

    struct AstronomyLocation: Codable {
        let time: [AstronomyTime]
    }

    struct AstronomyTime: Codable {
        let sunrise: AstronomyMoment?
        let sunset: AstronomyMoment?
        let moonrise: AstronomyMoment?
        let moonset: AstronomyMoment?
        let astronomicalTwilightBegin: AstronomyMoment?
        let astronomicalTwilightEnd: AstronomyMoment?

        enum CodingKeys: String, CodingKey {
            case sunrise
            case sunset
            case moonrise
            case moonset
            case astronomicalTwilightBegin = "astronomical_twilight_begin"
            case astronomicalTwilightEnd = "astronomical_twilight_end"
        }
    }

    struct AstronomyMoment: Codable {
        let time: String
    }
}

enum MoonPhaseCalculator {
    static func age(on date: Date) -> Double {
        let base = Date(timeIntervalSince1970: 947182440)
        let cycle = 29.530588853
        let diff = date.timeIntervalSince(base) / (24 * 60 * 60)
        let age = (diff.truncatingRemainder(dividingBy: cycle) + cycle).truncatingRemainder(dividingBy: cycle)
        return age
    }

    static func phaseName(for age: Double) -> String {
        switch age {
        case ..<1, 28.5...:
            return "新月"
        case ..<6.5:
            return "三日月"
        case ..<8.5:
            return "上弦の月"
        case ..<14:
            return "十三夜月"
        case ..<16:
            return "満月"
        case ..<21:
            return "寝待月"
        case ..<23:
            return "下弦の月"
        default:
            return "明けの三日月"
        }
    }
}
