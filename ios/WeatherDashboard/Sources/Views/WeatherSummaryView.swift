import SwiftUI

struct WeatherSummaryView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    private let weatherService = WeatherService()

    var body: some View {
        SectionCard("気象詳細") {
            if let weather = viewModel.weather,
               let snapshot = weatherService.snapshot(from: weather, targetDate: viewModel.selectedDate) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("気温: \(snapshot.temperature, specifier: "%.1f")°C")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)

                    Text("雲量: \(snapshot.cloudCover, specifier: "%.0f")% | 湿度: \(snapshot.humidity, specifier: "%.0f")%")
                        .foregroundStyle(.white.opacity(0.8))

                    Text("風速: \(snapshot.windSpeed, specifier: "%.1f") m/s | 視程: \(snapshot.visibility, specifier: "%.0f") km")
                        .foregroundStyle(.white.opacity(0.8))

                    if let daily = weatherService.dailySummary(from: weather, targetDate: viewModel.selectedDate) {
                        let summary = WeatherCodeMapper.map(daily.code)
                        HStack(spacing: 12) {
                            Image(systemName: summary.symbolName)
                                .foregroundStyle(.white)
                            VStack(alignment: .leading) {
                                Text(summary.label)
                                Text("最高 \(daily.max, specifier: "%.1f")°C / 最低 \(daily.min, specifier: "%.1f")°C")
                                    .font(.subheadline)
                                    .foregroundStyle(.white.opacity(0.8))
                            }
                        }
                    }
                }
            } else {
                Text("天気データを取得中...")
                    .foregroundStyle(.white.opacity(0.8))
            }
        }
    }
}

#Preview {
    WeatherSummaryView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
