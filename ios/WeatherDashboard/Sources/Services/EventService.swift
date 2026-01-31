import Foundation

final class EventService {
    private let meteorShowers: [MeteorShower] = [
        MeteorShower(name: "しぶんぎ座流星群", peakStart: "01-03", peakEnd: "01-04", rate: "120個/時", note: "年始の三大流星群"),
        MeteorShower(name: "こと座流星群", peakStart: "04-22", peakEnd: "04-23", rate: "18個/時", note: "安定した流星群"),
        MeteorShower(name: "みずがめ座η流星群", peakStart: "05-06", peakEnd: "05-07", rate: "50個/時", note: "南半球で好条件"),
        MeteorShower(name: "ペルセウス座流星群", peakStart: "08-12", peakEnd: "08-13", rate: "100個/時", note: "三大流星群の一つ"),
        MeteorShower(name: "オリオン座流星群", peakStart: "10-21", peakEnd: "10-22", rate: "20個/時", note: "ハレー彗星起源"),
        MeteorShower(name: "しし座流星群", peakStart: "11-17", peakEnd: "11-18", rate: "15個/時", note: "33年周期で大出現"),
        MeteorShower(name: "ふたご座流星群", peakStart: "12-13", peakEnd: "12-14", rate: "120個/時", note: "三大流星群の一つ"),
        MeteorShower(name: "こぐま座流星群", peakStart: "12-22", peakEnd: "12-23", rate: "10個/時", note: "安定した観測")
    ]

    func upcomingEvents(around date: Date) -> [CelestialEvent] {
        let calendar = Calendar.current
        return meteorShowers.compactMap { shower in
            guard let peakDate = dateFor(year: calendar.component(.year, from: date), monthDay: shower.peakStart) else { return nil }
            let diff = calendar.dateComponents([.day], from: date, to: peakDate).day ?? 0
            guard abs(diff) <= 7 else { return nil }
            let description: String
            if diff == 0 {
                description = "本日極大"
            } else if diff > 0 {
                description = "\(diff)日後が極大"
            } else {
                description = "\(abs(diff))日前が極大"
            }
            return CelestialEvent(
                name: shower.name,
                date: formatMonthDay(shower.peakStart),
                description: "\(description) | 目安: \(shower.rate)"
            )
        }
    }

    private func dateFor(year: Int, monthDay: String) -> Date? {
        let parts = monthDay.split(separator: "-")
        guard parts.count == 2,
              let month = Int(parts[0]),
              let day = Int(parts[1]) else { return nil }
        var components = DateComponents()
        components.year = year
        components.month = month
        components.day = day
        components.timeZone = TimeZone(identifier: "Asia/Tokyo")
        return Calendar.current.date(from: components)
    }

    private func formatMonthDay(_ value: String) -> String {
        let parts = value.split(separator: "-")
        guard parts.count == 2 else { return value }
        return "\(parts[0])月\(parts[1])日"
    }
}
