import SwiftUI

struct DatePickerView: View {
    @EnvironmentObject private var viewModel: AppViewModel

    var body: some View {
        SectionCard("日時選択") {
            DatePicker(
                "観測日時",
                selection: Binding(
                    get: { viewModel.selectedDate },
                    set: { viewModel.updateSelectedDate($0) }
                ),
                displayedComponents: [.date, .hourAndMinute]
            )
            .datePickerStyle(.graphical)
            .tint(.yellow)
        }
    }
}

#Preview {
    DatePickerView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
