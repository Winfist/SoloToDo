// patch-widget-bridge.cjs
// Fixes Xcode 26 incompatibility with capacitor-widget-bridge Package.swift
// The package defines product "CapacitorWidgetBridge" pointing to target "WidgetBridgePlugin"
// Xcode 26's SPM resolver generates broken hash-based GUIDs when product and target names differ.
// This patch renames the target to match the product name.

const fs = require('fs');
const path = require('path');

const packageSwiftPath = path.join(
  __dirname,
  'node_modules',
  'capacitor-widget-bridge',
  'Package.swift'
);

console.log(`[WidgetBridgePatch] Checking ${packageSwiftPath}`);

if (!fs.existsSync(packageSwiftPath)) {
  console.log('[WidgetBridgePatch] capacitor-widget-bridge not found. Skipping.');
  process.exit(0);
}

let content = fs.readFileSync(packageSwiftPath, 'utf-8');

// Check if already patched
if (!content.includes('WidgetBridgePlugin')) {
  console.log('[WidgetBridgePatch] Already patched or target name already matches. Skipping.');
  process.exit(0);
}

console.log('[WidgetBridgePatch] Original Package.swift:');
console.log(content);

// Replace target name "WidgetBridgePlugin" with "CapacitorWidgetBridge" everywhere
// But keep the path: parameter pointing to the original source directory
content = content
  // In products: targets: ["WidgetBridgePlugin"] -> targets: ["CapacitorWidgetBridge"]
  .replace(
    /targets:\s*\["WidgetBridgePlugin"\]/g,
    'targets: ["CapacitorWidgetBridge"]'
  )
  // In targets: .target(name: "WidgetBridgePlugin" -> .target(name: "CapacitorWidgetBridge"
  .replace(
    /\.target\(\s*\n\s*name:\s*"WidgetBridgePlugin"/g,
    '.target(\n            name: "CapacitorWidgetBridge"'
  )
  // In testTarget dependencies: ["WidgetBridgePlugin"] -> ["CapacitorWidgetBridge"]
  .replace(
    /dependencies:\s*\["WidgetBridgePlugin"\]/g,
    'dependencies: ["CapacitorWidgetBridge"]'
  )
  // In testTarget name: "WidgetBridgePluginTests" -> "CapacitorWidgetBridgeTests"
  .replace(
    /name:\s*"WidgetBridgePluginTests"/g,
    'name: "CapacitorWidgetBridgeTests"'
  );

fs.writeFileSync(packageSwiftPath, content, 'utf-8');

console.log('[WidgetBridgePatch] Patched Package.swift:');
console.log(content);
console.log('[WidgetBridgePatch] ✅ Successfully renamed WidgetBridgePlugin target to CapacitorWidgetBridge');
