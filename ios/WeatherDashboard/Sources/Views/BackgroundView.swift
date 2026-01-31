import SwiftUI

struct BackgroundView: View {
    var body: some View {
        LinearGradient(
            colors: [
                Color(red: 15/255, green: 23/255, blue: 42/255),
                Color(red: 30/255, green: 58/255, blue: 138/255),
                Color(red: 15/255, green: 23/255, blue: 42/255)
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

#Preview {
    BackgroundView()
}
