import Foundation

final class UserDefaultsStore {
    private let favoritesKey = "favoriteLocations"
    private let nightVisionKey = "nightVisionMode"
    private let defaults = UserDefaults.standard

    func loadFavorites() -> [FavoriteLocation] {
        guard let data = defaults.data(forKey: favoritesKey) else { return [] }
        return (try? JSONDecoder().decode([FavoriteLocation].self, from: data)) ?? []
    }

    func saveFavorites(_ favorites: [FavoriteLocation]) {
        let data = try? JSONEncoder().encode(favorites)
        defaults.set(data, forKey: favoritesKey)
    }

    func loadNightVision() -> Bool {
        defaults.bool(forKey: nightVisionKey)
    }

    func saveNightVision(_ enabled: Bool) {
        defaults.set(enabled, forKey: nightVisionKey)
    }
}
