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

    // We are looking for the requestAuthorization method implementation
    // from exactly this signature until its closing bracket and ensuring we wrap it in main.async
    const targetPattern = /implementation\.requestAuthorization\(readIdentifiers:\s*read,\s*writeIdentifiers:\s*write\)\s*\{\s*result\s*in[\s\S]*?\}\s*\}/g;

    if (content.includes('DispatchQueue.main.async {') && content.includes('self.implementation.requestAuthorization')) {
        console.log('[HealthPatch] Fix already applied.');
    } else if (content.includes('implementation.requestAuthorization(readIdentifiers: read, writeIdentifiers: write) { result in')) {
        console.log('[HealthPatch] Found target implementation call. Applying patch...');

        // Replace the call to ensure it's on the main thread.
        // Also change `implementation` to `self.implementation` to compile inside the block.
        content = content.replace(
            /implementation\.requestAuthorization\(readIdentifiers:\s*read,\s*writeIdentifiers:\s*write\)\s*\{\s*result\s*in\s*(DispatchQueue\.main\.async\s*\{[\s\S]*?\})\s*\}/,
            `DispatchQueue.main.async { [weak self] in\n            guard let self = self else { return }\n            self.implementation.requestAuthorization(readIdentifiers: read, writeIdentifiers: write) { result in\n                $1\n            }\n        }`
        );

        fs.writeFileSync(pluginPath, content, 'utf8');
        console.log('[HealthPatch] Successfully patched HealthPlugin.swift for iOS main thread UI requirements.');
    } else {
        console.warn('[HealthPatch] Could not find the exact code block to patch in HealthPlugin.swift. Please check the plugin version.');
    }
} else {
    console.log('[HealthPatch] iOS HealthPlugin source not found, likely because npm install has not fully resolved or it was removed. Skipping patch.');
}
