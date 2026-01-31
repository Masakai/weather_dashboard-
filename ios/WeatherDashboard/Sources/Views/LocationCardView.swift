import SwiftUI
import CoreLocation

struct LocationCardView: View {
    @EnvironmentObject private var viewModel: AppViewModel
    @State private var isMapOpen = false
    @State private var mapCoordinate = CLLocationCoordinate2D(latitude: 35.1167, longitude: 138.9167)

    var body: some View {
        SectionCard("場所") {
            VStack(alignment: .leading, spacing: 12) {
                Text(viewModel.locationName)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)

                Text(String(format: "緯度: %.4f | 経度: %.4f", viewModel.coordinate.latitude, viewModel.coordinate.longitude))
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))

                HStack(spacing: 12) {
                    Button {
                        viewModel.addFavorite()
                    } label: {
                        Label("お気に入り追加", systemImage: "star")
                    }
                    .buttonStyle(.borderedProminent)

                    Button {
                        viewModel.start()
                    } label: {
                        Label("現在地更新", systemImage: "location")
                    }
                    .buttonStyle(.bordered)
                }

                Button {
                    mapCoordinate = viewModel.coordinate
                    isMapOpen = true
                } label: {
                    Label("地図で場所を変更", systemImage: "map")
                }
                .buttonStyle(.bordered)

                if !viewModel.favoriteLocations.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("お気に入り")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white.opacity(0.8))

                        ForEach(viewModel.favoriteLocations) { favorite in
                            HStack {
                                Button {
                                    viewModel.selectFavorite(favorite)
                                } label: {
                                    Label(favorite.name, systemImage: "mappin.circle")
                                        .foregroundStyle(.white)
                                }
                                Spacer()
                                Button {
                                    viewModel.removeFavorite(favorite)
                                } label: {
                                    Image(systemName: "xmark.circle")
                                        .foregroundStyle(.red)
                                }
                            }
                            .padding(8)
                            .background(.white.opacity(0.05))
                            .cornerRadius(10)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $isMapOpen, onDismiss: {
            viewModel.coordinate = mapCoordinate
            Task { await viewModel.refreshAll(for: mapCoordinate) }
        }) {
            MapPickerView(coordinate: $mapCoordinate)
        }
    }
}

#Preview {
    LocationCardView()
        .environmentObject(AppViewModel.preview())
        .padding()
        .background(Color.black)
}
