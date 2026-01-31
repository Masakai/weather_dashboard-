import SwiftUI

struct HeaderView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        SectionCard("現在時刻") {
            VStack(alignment: .leading, spacing: 8) {
                TimelineView(.periodic(from: Date(), by: 1)) { timeline in
                    Text(DateHelpers.timeOnly.string(from: timeline.date))
                        .font(.system(size: 36, weight: .semibold, design: .monospaced))
                        .foregroundStyle(.white)
                }

                Text("Asia/Tokyo")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
    }
}

#Preview {
    HeaderView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
