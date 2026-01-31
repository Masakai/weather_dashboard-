import SwiftUI
import Charts

struct ForecastChartsView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        SectionCard("予報チャート") {
            if let data = viewModel.weather {
                let points = ChartDataBuilder.hourlyPoints(from: data, count: 24)
                Chart {
                    ForEach(points) { point in
                        LineMark(
                            x: .value("時刻", point.date),
                            y: .value("気温", point.temperature)
                        )
                        .foregroundStyle(.yellow)
                        LineMark(
                            x: .value("時刻", point.date),
                            y: .value("雲量", point.cloudCover)
                        )
                        .foregroundStyle(.blue)
                    }
                }
                .chartXAxis {
                    AxisMarks(values: .stride(by: .hour, count: 6)) { value in
                        AxisGridLine()
                        AxisValueLabel(format: .dateTime.hour())
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
                .frame(height: 200)
            } else {
                Text("チャートを準備中...")
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }
}

struct ChartPoint: Identifiable {
    let id = UUID()
    let date: Date
    let temperature: Double
    let cloudCover: Double
}

enum ChartDataBuilder {
    static func hourlyPoints(from response: WeatherResponse, count: Int) -> [ChartPoint] {
        var points: [ChartPoint] = []
        let limit = min(count, response.hourly.time.count)
        for index in 0..<limit {
            guard let date = DateHelpers.parseDateTime(response.hourly.time[index]) else { continue }
            points.append(
                ChartPoint(
                    date: date,
                    temperature: response.hourly.temperature_2m[index],
                    cloudCover: response.hourly.cloud_cover[index]
                )
            )
        }
        return points
    }
}

#Preview {
    ForecastChartsView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
