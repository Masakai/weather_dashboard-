import SwiftUI

struct StarryScoreView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    private let weatherService = WeatherService()

    var body: some View {
        SectionCard("視認性スコア") {
            if let weather = viewModel.weather,
               let snapshot = weatherService.snapshot(from: weather, targetDate: viewModel.selectedDate) {
                let moonAge = MoonPhaseCalculator.age(on: viewModel.selectedDate)
                let score = StarryScoreCalculator.calculate(
                    cloudCover: snapshot.cloudCover,
                    moonAge: moonAge,
                    humidity: snapshot.humidity,
                    visibility: snapshot.visibility,
                    windSpeed: snapshot.windSpeed
                )
                VStack(alignment: .leading, spacing: 12) {
                    ZStack {
                        Circle()
                            .stroke(.white.opacity(0.2), lineWidth: 12)
                        Circle()
                            .trim(from: 0, to: CGFloat(score) / 100)
                            .stroke(.yellow, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        VStack {
                            Text("\(score)")
                                .font(.largeTitle.bold())
                            Text("/ 100")
                                .font(.caption)
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                    .frame(width: 160, height: 160)

                    Text(StarryScoreCalculator.comment(for: score))
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.85))
                }
            } else {
                Text("スコア計算中...")
                    .foregroundStyle(.white.opacity(0.8))
            }
        }
    }
}

#Preview {
    StarryScoreView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
