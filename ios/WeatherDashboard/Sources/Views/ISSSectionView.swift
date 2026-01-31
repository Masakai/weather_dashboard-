import SwiftUI

struct ISSSectionView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        SectionCard("ISS通過情報") {
            VStack(alignment: .leading, spacing: 8) {
                Text("現在位置")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.8))
                Text(String(format: "緯度 %.2f / 経度 %.2f", viewModel.issStatus.latitude, viewModel.issStatus.longitude))
                    .foregroundStyle(.white.opacity(0.7))
                Text("高度 \(viewModel.issStatus.altitude, specifier: "%.0f") km | 速度 \(viewModel.issStatus.velocity, specifier: "%.1f") km/s")
                    .foregroundStyle(.white.opacity(0.7))

                Divider().background(.white.opacity(0.3))

                Text("次の通過予報")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.8))

                if viewModel.issPasses.isEmpty {
                    Text("通過情報を取得中...")
                        .foregroundStyle(.white.opacity(0.7))
                } else {
                    ForEach(viewModel.issPasses.prefix(5)) { pass in
                        HStack {
                            Text(DateHelpers.timeOnly.string(from: pass.startTime))
                                .foregroundStyle(.white)
                            Spacer()
                            VStack(alignment: .trailing, spacing: 2) {
                                Text("\(Int(pass.endTime.timeIntervalSince(pass.startTime) / 60))分 | 最大 \(pass.maxElevation, specifier: \"%.0f\")°")
                                    .foregroundStyle(.white.opacity(0.7))
                                Text(pass.isVisibleToNakedEye ? "肉眼で観測可能" : "撮影向き")
                                    .font(.caption2)
                                    .foregroundStyle(.white.opacity(0.6))
                            }
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    ISSSectionView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
