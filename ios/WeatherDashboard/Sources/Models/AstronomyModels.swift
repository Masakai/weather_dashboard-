import Foundation

struct AstronomySummary: Equatable {
    let sunrise: String
    let sunset: String
    let observationStart: String
    let observationEnd: String
    let moonrise: String
    let moonset: String
    let moonPhase: String
    let moonAge: String
    let visiblePlanets: [VisiblePlanet]

    static let placeholder = AstronomySummary(
        sunrise: "--:--",
        sunset: "--:--",
        observationStart: "--:--",
        observationEnd: "--:--",
        moonrise: "--:--",
        moonset: "--:--",
        moonPhase: "--",
        moonAge: "--",
        visiblePlanets: []
    )

    static let preview = AstronomySummary(
        sunrise: "06:42",
        sunset: "17:12",
        observationStart: "18:42",
        observationEnd: "05:12",
        moonrise: "20:05",
        moonset: "07:25",
        moonPhase: "上弦の月",
        moonAge: "7.5",
        visiblePlanets: [
            VisiblePlanet(name: "木星", altitude: 42, isVisible: true)
        ]
    )
}

struct CelestialEvent: Identifiable {
    let id = UUID()
    let name: String
    let date: String
    let description: String
}
