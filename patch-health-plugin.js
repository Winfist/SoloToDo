import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginPath = path.join(
    __dirname,
    'node_modules',
    '@capgo',
    'capacitor-health',
    'ios',
    'Sources',
    'HealthPlugin',
    'HealthPlugin.swift'
);

console.log(`[HealthPatch] Checking for HealthPlugin.swift at ${pluginPath}`);

if (fs.existsSync(pluginPath)) {
    let content = fs.readFileSync(pluginPath, 'utf8');

    // Check if our patch is already applied (look for 'let impl = self.implementation')
    if (content.includes('let impl = self.implementation')) {
        console.log('[HealthPatch] Fix already applied.');
        process.exit(0);
    }

    // The original plugin code for requestAuthorization looks like this:
    //   implementation.requestAuthorization(readIdentifiers: read, writeIdentifiers: write) { result in
    //       ...
    //   }
    //
    // OR a previously-broken patch may have wrapped it in:
    //   DispatchQueue.main.async { [weak self] in
    //       guard let self = self else { return }
    //       self.implementation.requestAuthorization(...)
    //   }
    //
    // Both patterns fail on Xcode 26 / Swift 6. Our fix:
    //   let impl = self.implementation
    //   DispatchQueue.main.async {
    //       impl.requestAuthorization(readIdentifiers: read, writeIdentifiers: write) { result in
    //           DispatchQueue.main.async { ... }
    //       }
    //   }

    // Strategy: replace the entire requestAuthorization method body
    const methodRegex = /@objc\s+func\s+requestAuthorization\s*\(\s*_\s+call:\s*CAPPluginCall\s*\)\s*\{[\s\S]*?\n    \}/;

    const replacement = `@objc func requestAuthorization(_ call: CAPPluginCall) {
        let read = (call.getArray("read") as? [String]) ?? []
        let write = (call.getArray("write") as? [String]) ?? []

        let impl = self.implementation
        DispatchQueue.main.async {
            impl.requestAuthorization(readIdentifiers: read, writeIdentifiers: write) { result in
                DispatchQueue.main.async {
                    switch result {
                    case let .success(payload):
                        call.resolve(payload.toDictionary())
                    case let .failure(error):
                        call.reject(error.localizedDescription, nil, error)
                    }
                }
            }
        }
    }`;

    if (methodRegex.test(content)) {
        content = content.replace(methodRegex, replacement);
        fs.writeFileSync(pluginPath, content, 'utf8');
        console.log('[HealthPatch] Successfully patched requestAuthorization for Xcode 26 / Swift 6 compatibility.');
    } else {
        console.warn('[HealthPatch] Could not find requestAuthorization method to patch. Plugin may have changed.');
    }
} else {
    console.log('[HealthPatch] iOS HealthPlugin source not found. Skipping patch.');
}
