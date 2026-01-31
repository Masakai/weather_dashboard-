import SwiftUI

struct WeeklyForecastView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        SectionCard("週間予報") {
            if let weather = viewModel.weather {
                VStack(spacing: 8) {
                    ForEach(Array(weather.daily.time.enumerated()), id: \.offset) { index, day in
                        let maxTemp = weather.daily.temperature_2m_max[index]
                        let minTemp = weather.daily.temperature_2m_min[index]
                        let code = weather.daily.weathercode[index]
                        let summary = WeatherCodeMapper.map(code)
                        HStack {
                            Text(formatDate(day))
                                .foregroundStyle(.white)
                            Spacer()
                            Image(systemName: summary.symbolName)
                            Text("\(minTemp, specifier: "%.0f")° / \(maxTemp, specifier: "%.0f")°")
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        .padding(8)
                        .background(.white.opacity(0.05))
                        .cornerRadius(10)
                    }
                }
            } else {
                Text("週間予報を取得中...")
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }

    private func formatDate(_ value: String) -> String {
        guard let date = DateHelpers.isoDate.date(from: value) else { return value }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ja_JP")
        formatter.dateFormat = "M/d (E)"
        return formatter.string(from: date)
    }
}

#Preview {
    WeeklyForecastView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
