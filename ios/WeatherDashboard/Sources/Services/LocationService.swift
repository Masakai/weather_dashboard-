import Foundation
import CoreLocation
import Combine

final class LocationService: NSObject {
    private let locationManager = CLLocationManager()
    private let subject = PassthroughSubject<Result<CLLocation, Error>, Never>()
    private let apiClient = APIClient()

    var locationPublisher: AnyPublisher<Result<CLLocation, Error>, Never> {
        subject.eraseToAnyPublisher()
    }

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func requestAuthorization() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.requestLocation()
    }

    func reverseGeocode(lat: Double, lon: Double) async throws -> String {
        let url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=\(lat)&lon=\(lon)&zoom=18&addressdetails=1&accept-language=ja"
        guard let requestUrl = URL(string: url) else { return "住所不明" }
        var request = URLRequest(url: requestUrl)
        request.setValue("WeatherDashboard/1.0 (iOS)", forHTTPHeaderField: "User-Agent")
        let response: NominatimResponse = try await apiClient.fetch(request)
        guard let address = response.address else {
            return "住所不明"
        }
        let pref = address.province ?? address.state ?? ""
        let city = address.city ?? address.ward ?? address.town ?? address.village ?? ""
        let sub = address.suburb ?? address.quarter ?? address.neighbourhood ?? ""
        let composed = "\(pref) \(city) \(sub)".trimmingCharacters(in: .whitespaces)
        return composed.isEmpty ? "不明な場所" : composed
    }
}

extension LocationService: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        subject.send(.success(location))
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        subject.send(.failure(error))
    }
}

struct NominatimResponse: Codable {
    let address: NominatimAddress?

    struct NominatimAddress: Codable {
        let province: String?
        let state: String?
        let city: String?
        let ward: String?
        let town: String?
        let village: String?
        let suburb: String?
        let quarter: String?
        let neighbourhood: String?
    }
}
