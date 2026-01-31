import SwiftUI

struct EventsSectionView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    private let eventService = EventService()

    var body: some View {
        SectionCard("天体イベント") {
            let events = eventService.upcomingEvents(around: viewModel.selectedDate)
            if events.isEmpty {
                Text("直近7日以内の主要イベントはありません")
                    .foregroundStyle(.white.opacity(0.7))
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(events) { event in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(event.name)
                                .font(.subheadline.weight(.semibold))
                            Text("\(event.date) - \(event.description)")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.75))
                        }
                        .padding(8)
                        .background(.white.opacity(0.05))
                        .cornerRadius(10)
                    }
                }
            }
        }
    }
}

#Preview {
    EventsSectionView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
