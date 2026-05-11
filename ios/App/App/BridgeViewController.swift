import Capacitor
import WebKit

@objc(BridgeViewController)
class BridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(ScreenTimePlugin())
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // ── Native App Feel: disable all zoom & browser behaviors ──
        if let webView = self.webView {
            // Disable pinch-to-zoom
            webView.scrollView.minimumZoomScale = 1.0
            webView.scrollView.maximumZoomScale = 1.0
            webView.scrollView.bouncesZoom = false

            // Disable rubber-band bounce effect (reveals WebView)
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false

            // Disable link preview (3D Touch / long press preview)
            webView.allowsLinkPreview = false

            // Disable content inset adjustments
            webView.scrollView.contentInsetAdjustmentBehavior = .never
        }
    }
}
