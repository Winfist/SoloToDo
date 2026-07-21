import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const cap = JSON.parse(read("capacitor.config.json"));
const manifest = read("android/app/src/main/AndroidManifest.xml");
const iosPackage = read("ios/App/CapApp-SPM/Package.swift");
const firebase = read("firebase.js");
const geminiHook = read("hooks/useGeminiAI.js");
const functionsIndex = read("functions/index.js");

for (const name of ["@capacitor/core", "@capacitor/android", "@capacitor/ios"]) {
  assert.equal(pkg.dependencies[name], "8.4.1", `${name} must stay on the common Capacitor stack`);
}
assert.equal(pkg.devDependencies["@capacitor/cli"], "8.4.1");
for (const name of ["@capacitor-firebase/authentication", "@capacitor-firebase/messaging", "@capacitor-firebase/analytics", "@capacitor-firebase/app-check"]) {
  assert.equal(pkg.dependencies[name], "8.3.0", `${name} must stay on the common Firebase plugin stack`);
}

const spm = cap.experimental?.ios?.spm;
assert.equal(spm?.swiftToolsVersion, "6.1");
assert.deepEqual(spm?.packageTraits?.["@capacitor-firebase/analytics"], ["AnalyticsWithoutAdIdSupport"]);
for (const name of ["@capacitor-firebase/authentication", "@capacitor-firebase/messaging", "@capacitor-firebase/analytics", "@capacitor-firebase/app-check"]) {
  assert.equal(spm?.packageOptions?.[name]?.symlink, true, `${name} needs SPM symlinks`);
}
assert.ok(iosPackage.includes('.package(name: "CapacitorFirebaseAppCheck", path: "symlinks/CapacitorFirebaseAppCheck")'));
assert.ok(iosPackage.includes('.product(name: "CapacitorFirebaseAppCheck", package: "CapacitorFirebaseAppCheck")'));
assert.ok(iosPackage.includes('CapacitorFirebaseAnalytics", path: "symlinks/CapacitorFirebaseAnalytics", traits: ["AnalyticsWithoutAdIdSupport"]'));

assert.match(manifest, /google_analytics_adid_collection_enabled[\s\S]{0,120}android:value="false"/);
assert.match(manifest, /google_analytics_default_allow_ad_personalization_signals[\s\S]{0,120}android:value="false"/);
assert.match(manifest, /com\.google\.android\.gms\.permission\.AD_ID/, "AdMob AD_ID permission must remain available");

assert.match(firebase, /new CustomProvider/);
assert.match(firebase, /FirebaseAppCheck\.getToken\(\{ forceRefresh: false \}\)/);
assert.match(geminiHook, /await appCheckReady;/, "Forge callables must wait for the native token bridge");
assert.match(firebase, /initializeAppCheck\(app, \{ provider, isTokenAutoRefreshEnabled: true \}\)/);
assert.match(functionsIndex, /enforceAppCheck:\s*false/, "enforcement remains off until old native builds age out");

console.log("test-native-forge-config: all assertions passed.");
