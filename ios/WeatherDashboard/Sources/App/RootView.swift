import SwiftUI

struct RootView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        ZStack {
            BackgroundView()
                .ignoresSafeArea()

            NavigationStack {
                ScrollView {
                    VStack(spacing: 16) {
                        HeaderView()
                        DatePickerView()
                        LocationCardView()
                        WeatherSummaryView()
                        StarryScoreView()
                        ObservationTimelineView()
                        ForecastChartsView()
                        WeeklyForecastView()
                        ISSSectionView()
                        EventsSectionView()
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 32)
                }
                .navigationTitle("天体観測できるかな？")
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            viewModel.toggleNightVision()
                        } label: {
                            Image(systemName: viewModel.isNightVisionEnabled ? "moon.fill" : "moon")
                        }
                        .accessibilityLabel("ナイトビジョン")
                    }
                }
            }
            .tint(.white)

            if viewModel.isNightVisionEnabled {
                NightVisionOverlay()
                    .ignoresSafeArea()
                    .allowsHitTesting(false)
            }
        }
        .onAppear {
            viewModel.start()
        }
        .alert(item: $viewModel.errorMessage) { message in
            Alert(title: Text("エラー"), message: Text(message), dismissButton: .default(Text("OK")))
        }
    }
}

#Preview {
    RootView()
        .environmentObject(AppViewModel.preview())
}
