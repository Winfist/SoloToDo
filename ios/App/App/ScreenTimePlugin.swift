import Foundation
import Capacitor

#if canImport(FamilyControls)
import FamilyControls
#endif

@objc(ScreenTimePlugin)
public class ScreenTimePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenTimePlugin"
    public let jsName = "ScreenTimePlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getCapabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncHistory", returnType: CAPPluginReturnPromise)
    ]

    @objc func getCapabilities(_ call: CAPPluginCall) {
        call.resolve(capabilitiesPayload())
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *) {
            Task {
                do {
                    try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                    DispatchQueue.main.async {
                        call.resolve(self.capabilitiesPayload())
                    }
                } catch {
                    DispatchQueue.main.async {
                        call.resolve(self.capabilitiesPayload(reasonOverride: "screen-time-authorization-failed: \(error.localizedDescription)"))
                    }
                }
            }
            return
        }
        #endif

        call.resolve(capabilitiesPayload(reasonOverride: "family-controls-authorization-unavailable"))
    }

    @objc func syncToday(_ call: CAPPluginCall) {
        call.resolve([
            "capabilities": capabilitiesPayload(),
            "day": NSNull(),
            "reason": "screen-time-duration-export-unavailable"
        ])
    }

    @objc func syncHistory(_ call: CAPPluginCall) {
        call.resolve([
            "capabilities": capabilitiesPayload(),
            "days": [],
            "reason": "screen-time-duration-export-unavailable"
        ])
    }

    private func capabilitiesPayload(reasonOverride: String? = nil) -> [String: Any] {
        #if canImport(FamilyControls)
        let status = authorizationStatusLabel()
        let hasDataAccess = status.lowercased().contains("data")
        let reason = reasonOverride ?? (hasDataAccess
            ? "family-activity-data-access-present-duration-export-not-enabled"
            : "family-controls-available-duration-export-unavailable")

        return [
            "nativeAvailable": true,
            "authorizationStatus": status,
            "dataAccessAvailable": hasDataAccess,
            "canExportDurations": false,
            "reason": reason
        ]
        #else
        return [
            "nativeAvailable": false,
            "authorizationStatus": "unavailable",
            "dataAccessAvailable": false,
            "canExportDurations": false,
            "reason": reasonOverride ?? "family-controls-framework-unavailable"
        ]
        #endif
    }

    private func authorizationStatusLabel() -> String {
        #if canImport(FamilyControls)
        if #available(iOS 16.0, *) {
            return String(describing: AuthorizationCenter.shared.authorizationStatus)
        }
        return "unsupported-ios-version"
        #else
        return "unavailable"
        #endif
    }
}
