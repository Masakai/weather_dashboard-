import Foundation

struct VisiblePlanet: Identifiable, Equatable {
    let id = UUID()
    let name: String
    let altitude: Double
    let isVisible: Bool
}
