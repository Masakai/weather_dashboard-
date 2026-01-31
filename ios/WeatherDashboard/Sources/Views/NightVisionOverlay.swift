import SwiftUI

struct NightVisionOverlay: View {
    var body: some View {
        Rectangle()
            .fill(Color(red: 120/255, green: 0, blue: 0).opacity(0.35))
            .blendMode(.multiply)
    }
}

#Preview {
    ZStack {
        Color.black
        NightVisionOverlay()
    }
}
