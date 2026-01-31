import Foundation
import UserNotifications

final class NotificationService {
    func requestAuthorization() async {
        let center = UNUserNotificationCenter.current()
        do {
            _ = try await center.requestAuthorization(options: [.alert, .sound])
        } catch {
            print("Notification permission error: \(error)")
        }
    }

    func scheduleISSPassNotifications(_ passes: [ISSPass]) async {
        let center = UNUserNotificationCenter.current()
        let existing = await center.pendingNotificationRequests()
        let existingIds = Set(existing.map { $0.identifier })

        for pass in passes {
            let triggerDate = pass.startTime.addingTimeInterval(-3600)
            guard triggerDate > Date() else { continue }
            let identifier = "iss-pass-\(Int(pass.startTime.timeIntervalSince1970))"
            guard !existingIds.contains(identifier) else { continue }

            let content = UNMutableNotificationContent()
            content.title = "🛰️ ISS通過まもなく！"
            let start = DateHelpers.timeOnly.string(from: pass.startTime)
            let duration = Int(pass.endTime.timeIntervalSince(pass.startTime) / 60)
            content.body = "約1時間後（\(start)頃）にISS通過があります。継続時間: \(duration)分"
            content.sound = .default

            let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: triggerDate)
            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
            let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
            try? await center.add(request)
        }
    }
}
