import Foundation
import Combine
import CoreLocation

@MainActor
final class AppViewModel: ObservableObject {
    @Published var locationName: String = "位置情報を取得中..."
    @Published var coordinate: CLLocationCoordinate2D = CLLocationCoordinate2D(latitude: 35.1167, longitude: 138.9167)
    @Published var weather: WeatherResponse?
    @Published var selectedDate: Date = Date()
    @Published var isNightVisionEnabled: Bool = false
    @Published var favoriteLocations: [FavoriteLocation] = []
    @Published var issStatus: ISSStatus = .placeholder
    @Published var issPasses: [ISSPass] = []
    @Published var astronomySummary: AstronomySummary = .placeholder
    @Published var errorMessage: AppErrorMessage?

    private let locationService = LocationService()
    private let weatherService = WeatherService()
    private let issService = ISSService()
    private let astronomyService = AstronomyService()
    private let notificationService = NotificationService()
    private let store = UserDefaultsStore()
    private var cancellables = Set<AnyCancellable>()

    func start() {
        if !favoriteLocationsLoaded {
            favoriteLocations = store.loadFavorites()
            isNightVisionEnabled = store.loadNightVision()
            favoriteLocationsLoaded = true
        }

        bindLocationUpdates()
        locationService.requestAuthorization()
        Task { await notificationService.requestAuthorization() }
    }

    private var favoriteLocationsLoaded = false

    private func bindLocationUpdates() {
        locationService.locationPublisher
            .receive(on: RunLoop.main)
            .sink { [weak self] result in
                guard let self else { return }
                switch result {
                case .success(let location):
                    self.coordinate = location.coordinate
                    Task {
                        await self.refreshAll(for: location.coordinate)
                    }
                case .failure(let error):
                    self.errorMessage = AppErrorMessage(message: error.localizedDescription)
                    Task {
                        await self.refreshAll(for: self.coordinate)
                    }
                }
            }
            .store(in: &cancellables)
    }

    func refreshAll(for coordinate: CLLocationCoordinate2D) async {
        do {
            async let name = locationService.reverseGeocode(lat: coordinate.latitude, lon: coordinate.longitude)
            async let iss = issService.fetchISSStatus(lat: coordinate.latitude, lon: coordinate.longitude)
            async let passes = issService.fetchISSPasses(lat: coordinate.latitude, lon: coordinate.longitude)
            async let astronomy = astronomyService.fetchSummary(date: selectedDate, lat: coordinate.latitude, lon: coordinate.longitude)

            self.locationName = try await name
            let weather = try await weatherService.fetchWeather(lat: coordinate.latitude, lon: coordinate.longitude)
            self.weather = weather
            self.issStatus = try await iss
            let passes = try await passes
            self.issPasses = passes
            Task { await notificationService.scheduleISSPassNotifications(passes) }
            self.astronomySummary = try await astronomy
        } catch {
            self.errorMessage = AppErrorMessage(message: error.localizedDescription)
        }
    }

    func toggleNightVision() {
        isNightVisionEnabled.toggle()
        store.saveNightVision(isNightVisionEnabled)
    }

    func addFavorite() {
        let newLocation = FavoriteLocation(name: locationName, latitude: coordinate.latitude, longitude: coordinate.longitude)
        var updated = favoriteLocations
        updated.append(newLocation)
        if updated.count > 5 {
            updated.removeFirst(updated.count - 5)
        }
        favoriteLocations = updated
        store.saveFavorites(updated)
    }

    func removeFavorite(_ favorite: FavoriteLocation) {
        favoriteLocations.removeAll { $0.id == favorite.id }
        store.saveFavorites(favoriteLocations)
    }

    func selectFavorite(_ favorite: FavoriteLocation) {
        coordinate = CLLocationCoordinate2D(latitude: favorite.latitude, longitude: favorite.longitude)
        Task {
            await refreshAll(for: coordinate)
        }
    }

    func updateSelectedDate(_ date: Date) {
        selectedDate = date
        Task {
            await refreshAll(for: coordinate)
        }
    }

    static func preview() -> AppViewModel {
        let viewModel = AppViewModel()
        viewModel.locationName = "静岡県 三島市"
        viewModel.coordinate = CLLocationCoordinate2D(latitude: 35.1167, longitude: 138.9167)
        viewModel.weather = WeatherResponse.preview
        viewModel.favoriteLocations = [
            FavoriteLocation(name: "三島", latitude: 35.1167, longitude: 138.9167)
        ]
        viewModel.issStatus = .preview
        viewModel.issPasses = ISSPass.sample
        viewModel.astronomySummary = .preview
        return viewModel
    }
}

struct AppErrorMessage: Identifiable {
    let id = UUID()
    let message: String
}
