import Foundation

#if canImport(SwiftAA)
import SwiftAA
#endif

final class ISSService {
    private let apiClient = APIClient()

    func fetchISSStatus(lat: Double, lon: Double) async throws -> ISSStatus {
        let response: ISSPositionResponse = try await apiClient.fetch("https://api.wheretheiss.at/v1/satellites/25544")
        return ISSStatus(
            latitude: response.latitude,
            longitude: response.longitude,
            altitude: response.altitude,
            velocity: response.velocity,
            timestamp: Date(timeIntervalSince1970: response.timestamp)
        )
    }

    func fetchISSPasses(lat: Double, lon: Double) async throws -> [ISSPass] {
        let wheretheissUrl = "https://api.wheretheiss.at/v1/satellites/25544/passes?lat=\(lat)&lon=\(lon)&alt=0&days=5"
        if let passes = try? await fetchWheretheissPasses(url: wheretheissUrl, lat: lat, lon: lon), !passes.isEmpty {
            return passes
        }

        let openNotifyUrl = "http://api.open-notify.org/iss-pass.json?lat=\(lat)&lon=\(lon)"
        let response: ISSPassResponse = try await apiClient.fetch(openNotifyUrl)
        return response.response.map { entry in
            let start = Date(timeIntervalSince1970: TimeInterval(entry.risetime))
            let end = start.addingTimeInterval(TimeInterval(entry.duration))
            let maxElevation = entry.maxElevation ?? 0
            return ISSPass(
                startTime: start,
                endTime: end,
                maxElevation: maxElevation,
                isVisibleToNakedEye: ISSService.isNakedEyeVisible(at: start, lat: lat, lon: lon, elevation: maxElevation)
            )
        }
    }

    private func fetchWheretheissPasses(url: String, lat: Double, lon: Double) async throws -> [ISSPass] {
        guard let requestUrl = URL(string: url) else { return [] }
        let (data, response) = try await URLSession.shared.data(from: requestUrl)
        guard let http = response as? HTTPURLResponse, 200..<300 ~= http.statusCode else { return [] }

        let decoder = JSONDecoder()
        if let list = try? decoder.decode([WheretheissPass].self, from: data) {
            return list.compactMap { $0.toISSPass(lat: lat, lon: lon) }
        }
        if let wrapper = try? decoder.decode(WheretheissPassWrapper.self, from: data) {
            return wrapper.response.compactMap { $0.toISSPass(lat: lat, lon: lon) }
        }
        return []
    }

    static func isNakedEyeVisible(at date: Date, lat: Double, lon: Double, elevation: Double) -> Bool {
        guard elevation > 20 else { return false }
        #if canImport(SwiftAA)
        let julianDay = JulianDay(date)
        let geo = GeographicCoordinates(positivelyWestwardLongitude: Degrees(-lon), latitude: Degrees(lat))
        let observer = Observer(geographicCoordinates: geo, altitude: Meters(0))
        let sun = Sun(julianDay)
        let horizontal = sun.apparentEquatorialCoordinates.makeHorizontalCoordinates(for: observer, at: julianDay)
        return horizontal.altitude.inDegrees < -6
        #else
        return false
        #endif
    }
}

struct ISSPositionResponse: Codable {
    let name: String
    let id: Int
    let latitude: Double
    let longitude: Double
    let altitude: Double
    let velocity: Double
    let visibility: String
    let timestamp: TimeInterval
}

struct ISSPassResponse: Codable {
    let message: String
    let request: ISSPassRequest
    let response: [ISSPassEntry]

    struct ISSPassRequest: Codable {
        let altitude: Double?
        let datetime: TimeInterval
        let latitude: Double
        let longitude: Double
        let passes: Int
    }

    struct ISSPassEntry: Codable {
        let duration: Int
        let risetime: Int
        let maxElevation: Double?

        enum CodingKeys: String, CodingKey {
            case duration
            case risetime
            case maxElevation = "max_elevation"
        }
    }
}

struct WheretheissPassWrapper: Codable {
    let response: [WheretheissPass]
}

struct WheretheissPass: Codable {
    let risetime: TimeInterval?
    let duration: TimeInterval?
    let maxElevation: Double?
    let startUTC: TimeInterval?
    let endUTC: TimeInterval?

    enum CodingKeys: String, CodingKey {
        case risetime
        case duration
        case maxElevation = "max_elevation"
        case startUTC = "startUTC"
        case endUTC = "endUTC"
    }

    func toISSPass(lat: Double, lon: Double) -> ISSPass? {
        let startTime: Date
        let endTime: Date
        if let startUTC, let endUTC {
            startTime = Date(timeIntervalSince1970: startUTC)
            endTime = Date(timeIntervalSince1970: endUTC)
        } else if let risetime, let duration {
            startTime = Date(timeIntervalSince1970: risetime)
            endTime = startTime.addingTimeInterval(duration)
        } else {
            return nil
        }
        let elevation = maxElevation ?? 0
        let visible = ISSService.isNakedEyeVisible(at: startTime, lat: lat, lon: lon, elevation: elevation)
        return ISSPass(startTime: startTime, endTime: endTime, maxElevation: elevation, isVisibleToNakedEye: visible)
    }
}
