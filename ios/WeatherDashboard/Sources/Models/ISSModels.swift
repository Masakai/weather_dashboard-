import Foundation

struct ISSStatus: Equatable {
    let latitude: Double
    let longitude: Double
    let altitude: Double
    let velocity: Double
    let timestamp: Date

    static let placeholder = ISSStatus(latitude: 0, longitude: 0, altitude: 0, velocity: 0, timestamp: Date())
    static let preview = ISSStatus(latitude: 34.9, longitude: 138.4, altitude: 420, velocity: 7.6, timestamp: Date())
}

struct ISSPass: Identifiable, Equatable {
    let id = UUID()
    let startTime: Date
    let endTime: Date
    let maxElevation: Double
    let isVisibleToNakedEye: Bool

    static let sample: [ISSPass] = [
        ISSPass(startTime: Date().addingTimeInterval(3600), endTime: Date().addingTimeInterval(4200), maxElevation: 45, isVisibleToNakedEye: true)
    ]
}
