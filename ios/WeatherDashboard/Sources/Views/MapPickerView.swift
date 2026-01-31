import SwiftUI
import MapKit

struct MapPickerView: View {
    @Binding var coordinate: CLLocationCoordinate2D
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            MapPickerRepresentable(coordinate: $coordinate)
                .ignoresSafeArea()
                .navigationTitle("場所を選択")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("完了") {
                            dismiss()
                        }
                    }
                }
        }
    }
}

struct MapPickerRepresentable: UIViewRepresentable {
    @Binding var coordinate: CLLocationCoordinate2D

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        mapView.isRotateEnabled = false
        mapView.pointOfInterestFilter = .excludingAll
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        mapView.addGestureRecognizer(tap)
        updateRegion(mapView)
        return mapView
    }

    func updateUIView(_ mapView: MKMapView, context: Context) {
        updateRegion(mapView)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    private func updateRegion(_ mapView: MKMapView) {
        let region = MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.2, longitudeDelta: 0.2)
        )
        mapView.setRegion(region, animated: true)
        mapView.removeAnnotations(mapView.annotations)
        let annotation = MKPointAnnotation()
        annotation.coordinate = coordinate
        mapView.addAnnotation(annotation)
    }

    final class Coordinator: NSObject, MKMapViewDelegate {
        private let parent: MapPickerRepresentable

        init(_ parent: MapPickerRepresentable) {
            self.parent = parent
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let mapView = gesture.view as? MKMapView else { return }
            let point = gesture.location(in: mapView)
            let coordinate = mapView.convert(point, toCoordinateFrom: mapView)
            parent.coordinate = coordinate
        }
    }
}

#Preview {
    MapPickerView(coordinate: .constant(CLLocationCoordinate2D(latitude: 35.0, longitude: 138.0)))
}
