import SwiftUI

struct ObservationTimelineView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        SectionCard("観測計画") {
            VStack(alignment: .leading, spacing: 8) {
                Text("日没: \(viewModel.astronomySummary.sunset)  日の出: \(viewModel.astronomySummary.sunrise)")
                    .foregroundStyle(.white.opacity(0.8))
                Text("観測開始: \(viewModel.astronomySummary.observationStart)  観測終了: \(viewModel.astronomySummary.observationEnd)")
                    .foregroundStyle(.white.opacity(0.8))
                Text("月齢: \(viewModel.astronomySummary.moonAge)  \(viewModel.astronomySummary.moonPhase)")
                    .foregroundStyle(.white.opacity(0.8))
                Text("月の出: \(viewModel.astronomySummary.moonrise)  月の入: \(viewModel.astronomySummary.moonset)")
                    .foregroundStyle(.white.opacity(0.8))

                if !viewModel.astronomySummary.visiblePlanets.isEmpty {
                    Divider().background(.white.opacity(0.3))
                    Text("観測可能な惑星")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.8))
                    ForEach(viewModel.astronomySummary.visiblePlanets) { planet in
                        HStack {
                            Text(planet.name)
                                .foregroundStyle(.white)
                            Spacer()
                            Text(planet.isVisible ? "\(planet.altitude, specifier: \"%.0f\")°" : "地平線下")
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    ObservationTimelineView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
