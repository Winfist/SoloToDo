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

if (!fs.existsSync(pluginPath)) {
    console.log('[HealthPatch] iOS HealthPlugin source not found. Skipping patch.');
    process.exit(0);
}

let content = fs.readFileSync(pluginPath, 'utf8');

// ─── Check if our robust patch is already applied ───────────────────────────
if (content.includes('let impl = self.implementation')) {
    console.log('[HealthPatch] Fix already applied (impl capture variant). Skipping.');
    process.exit(0);
}

// ─── Approach 1: Capture list missing 'in' keyword (Swift 6 incompatible) ──
// Original npm package ships with:
//   DispatchQueue.main.async { [weak self]
// Swift 6 / Xcode 26 requires:
//   DispatchQueue.main.async { [weak self] in
// We do a full method replacement for maximum reliability.

// Find the start of the requestAuthorization method
const methodStart = '@objc func requestAuthorization(_ call: CAPPluginCall)';
const methodStartIdx = content.indexOf(methodStart);

if (methodStartIdx === -1) {
    console.warn('[HealthPatch] Could not locate requestAuthorization method. Plugin may have changed structure.');
    process.exit(0);
}

// Walk forward from method start to find the matching closing brace
let braceDepth = 0;
let methodEnd = -1;
let foundFirstBrace = false;

for (let i = methodStartIdx; i < content.length; i++) {
    if (content[i] === '{') {
        braceDepth++;
        foundFirstBrace = true;
    } else if (content[i] === '}') {
        braceDepth--;
        if (foundFirstBrace && braceDepth === 0) {
            methodEnd = i;
            break;
        }
    }
}

if (methodEnd === -1) {
    console.warn('[HealthPatch] Could not find end of requestAuthorization method.');
    process.exit(0);
}

const originalMethod = content.substring(methodStartIdx, methodEnd + 1);
console.log('[HealthPatch] Found requestAuthorization method, applying patch...');

// Replacement: avoid [weak self] capture entirely — capture impl before async block
const patchedMethod = `@objc func requestAuthorization(_ call: CAPPluginCall) {
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

const patchedContent = content.substring(0, methodStartIdx) + patchedMethod + content.substring(methodEnd + 1);
fs.writeFileSync(pluginPath, patchedContent, 'utf8');
console.log('[HealthPatch] ✅ Successfully patched requestAuthorization for Xcode 26 / Swift 6 compatibility.');
