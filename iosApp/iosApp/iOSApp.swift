import SwiftUI
import shared

@main
struct iOSApp: App {
    var body: some Scene {
        WindowGroup {
            ComposeView()
        }
    }
}

struct ComposeView: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        return MainViewControllerKt.MainViewController()
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}
