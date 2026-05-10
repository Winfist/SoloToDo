#!/usr/bin/env node
// ─── PATCH WIDGET EXTENSION ──────────────────────────────────
// Programmatically patches the Xcode project to include the
// SoloToDoWidget extension target. Runs in CI/CD (GitHub Actions)
// before xcodebuild, so no manual Xcode access is needed.
//
// Usage: node patch-widget-extension.js
// Called from package.json postinstall or GitHub Actions workflow.

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.join(__dirname, 'ios', 'App');
const PBXPROJ_PATH = path.join(PROJECT_DIR, 'App.xcodeproj', 'project.pbxproj');
const WIDGET_SOURCE_DIR = path.join(PROJECT_DIR, 'SoloToDoWidget');

// Check if widget files exist
if (!fs.existsSync(WIDGET_SOURCE_DIR)) {
  console.log('[Widget Patch] No SoloToDoWidget directory found — skipping.');
  process.exit(0);
}

// Check if pbxproj exists
if (!fs.existsSync(PBXPROJ_PATH)) {
  console.log('[Widget Patch] No project.pbxproj found — skipping (not in iOS build context).');
  process.exit(0);
}

let pbxproj = fs.readFileSync(PBXPROJ_PATH, 'utf-8');

// Check if already patched
if (pbxproj.includes('SoloToDoWidgetExtension')) {
  console.log('[Widget Patch] Widget extension already patched — skipping.');
  process.exit(0);
}

console.log('[Widget Patch] Patching project.pbxproj for SoloToDoWidget extension...');

// ─── Generate deterministic UUIDs ────────────────────────────
// We use fixed UUIDs so the patch is idempotent
const UUIDS = {
  // Widget target
  widgetTarget:        'E1A2B3C4D5E6F7A8B9C0D1E2',
  widgetProductRef:    'E1A2B3C4D5E6F7A8B9C0D1E3',
  widgetProduct:       'E1A2B3C4D5E6F7A8B9C0D1E4',
  widgetConfigList:    'E1A2B3C4D5E6F7A8B9C0D1E5',
  widgetConfigDebug:   'E1A2B3C4D5E6F7A8B9C0D1E6',
  widgetConfigRelease: 'E1A2B3C4D5E6F7A8B9C0D1E7',
  // Build phases
  widgetSourcesPhase:  'E1A2B3C4D5E6F7A8B9C0D1E8',
  widgetFrameworkPhase: 'E1A2B3C4D5E6F7A8B9C0D1E9',
  widgetResourcesPhase:'E1A2B3C4D5E6F7A8B9C0D1EA',
  // Source files
  widgetBundleRef:     'E1A2B3C4D5E6F7A8B9C0D1EB',
  widgetBundleBuild:   'E1A2B3C4D5E6F7A8B9C0D1EC',
  dataModelRef:        'E1A2B3C4D5E6F7A8B9C0D1ED',
  dataModelBuild:      'E1A2B3C4D5E6F7A8B9C0D1EE',
  sharedStylesRef:     'E1A2B3C4D5E6F7A8B9C0D1EF',
  sharedStylesBuild:   'E1A2B3C4D5E6F7A8B9C0D1F0',
  smallViewRef:        'E1A2B3C4D5E6F7A8B9C0D1F1',
  smallViewBuild:      'E1A2B3C4D5E6F7A8B9C0D1F2',
  mediumViewRef:       'E1A2B3C4D5E6F7A8B9C0D1F3',
  mediumViewBuild:     'E1A2B3C4D5E6F7A8B9C0D1F4',
  largeViewRef:        'E1A2B3C4D5E6F7A8B9C0D1F5',
  largeViewBuild:      'E1A2B3C4D5E6F7A8B9C0D1F6',
  lockScreenRef:       'E1A2B3C4D5E6F7A8B9C0D1F7',
  lockScreenBuild:     'E1A2B3C4D5E6F7A8B9C0D1F8',
  infoPlistRef:        'E1A2B3C4D5E6F7A8B9C0D1F9',
  entitlementsRef:     'E1A2B3C4D5E6F7A8B9C0D1FA',
  // Groups
  widgetGroup:         'E1A2B3C4D5E6F7A8B9C0D1FB',
  // Embed extension
  embedPhase:          'E1A2B3C4D5E6F7A8B9C0D1FC',
  embedProductRef:     'E1A2B3C4D5E6F7A8B9C0D1FD',
  // Target dependency
  targetDependency:    'E1A2B3C4D5E6F7A8B9C0D1FE',
  targetProxy:         'E1A2B3C4D5E6F7A8B9C0D1FF',
};

// ─── Swift source files to include ───────────────────────────
const SWIFT_FILES = [
  { name: 'SoloToDoWidgetBundle.swift', refId: UUIDS.widgetBundleRef, buildId: UUIDS.widgetBundleBuild },
  { name: 'WidgetDataModel.swift', refId: UUIDS.dataModelRef, buildId: UUIDS.dataModelBuild },
  { name: 'SharedStyles.swift', refId: UUIDS.sharedStylesRef, buildId: UUIDS.sharedStylesBuild },
  { name: 'SmallWidgetView.swift', refId: UUIDS.smallViewRef, buildId: UUIDS.smallViewBuild },
  { name: 'MediumWidgetView.swift', refId: UUIDS.mediumViewRef, buildId: UUIDS.mediumViewBuild },
  { name: 'LargeWidgetView.swift', refId: UUIDS.largeViewRef, buildId: UUIDS.largeViewBuild },
  { name: 'LockScreenWidgets.swift', refId: UUIDS.lockScreenRef, buildId: UUIDS.lockScreenBuild },
];

// ─── 1. Add PBXFileReference entries ─────────────────────────
const fileRefSection = '/* End PBXFileReference section */';
const fileRefs = SWIFT_FILES.map(f =>
  `\t\t${f.refId} /* ${f.name} */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = ${f.name}; sourceTree = "<group>"; };`
).join('\n') + '\n' +
  `\t\t${UUIDS.infoPlistRef} /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };\n` +
  `\t\t${UUIDS.entitlementsRef} /* SoloToDoWidget.entitlements */ = {isa = PBXFileReference; lastKnownFileType = text.plist.entitlements; path = SoloToDoWidget.entitlements; sourceTree = "<group>"; };\n` +
  `\t\t${UUIDS.widgetProduct} /* SoloToDoWidgetExtension.appex */ = {isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = SoloToDoWidgetExtension.appex; sourceTree = BUILT_PRODUCTS_DIR; };`;

pbxproj = pbxproj.replace(fileRefSection, fileRefs + '\n' + fileRefSection);

// ─── 2. Add PBXBuildFile entries ─────────────────────────────
const buildFileSection = '/* End PBXBuildFile section */';
const buildFiles = SWIFT_FILES.map(f =>
  `\t\t${f.buildId} /* ${f.name} in Sources */ = {isa = PBXBuildFile; fileRef = ${f.refId} /* ${f.name} */; };`
).join('\n') + '\n' +
  `\t\t${UUIDS.embedProductRef} /* SoloToDoWidgetExtension.appex in Embed App Extensions */ = {isa = PBXBuildFile; fileRef = ${UUIDS.widgetProduct} /* SoloToDoWidgetExtension.appex */; settings = {ATTRIBUTES = (RemoveHeadersOnCopy, ); }; };`;

pbxproj = pbxproj.replace(buildFileSection, buildFiles + '\n' + buildFileSection);

// ─── 3. Add PBXGroup for SoloToDoWidget ──────────────────────
const mainGroupEnd = '/* End PBXGroup section */';
const widgetGroupEntry = `\t\t${UUIDS.widgetGroup} /* SoloToDoWidget */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
${SWIFT_FILES.map(f => `\t\t\t\t${f.refId} /* ${f.name} */,`).join('\n')}
\t\t\t\t${UUIDS.infoPlistRef} /* Info.plist */,
\t\t\t\t${UUIDS.entitlementsRef} /* SoloToDoWidget.entitlements */,
\t\t\t);
\t\t\tpath = SoloToDoWidget;
\t\t\tsourceTree = "<group>";
\t\t};`;

pbxproj = pbxproj.replace(mainGroupEnd, widgetGroupEntry + '\n' + mainGroupEnd);

// Add widget group reference to root group
// Find the root group's children array and add the widget group
const rootGroupChildrenPattern = /(children = \(\s*(?:.*?\n)*?)((\s*\);[\s\S]*?sourceTree = "<group>";\s*\};[\s\S]*?\/\* End PBXGroup))/;
const rootMatch = pbxproj.match(rootGroupChildrenPattern);
if (rootMatch) {
  // Just add to the first children array we find
  pbxproj = pbxproj.replace(
    /(\t\t\t\tchildren = \()/,
    `$1\n\t\t\t\t\t${UUIDS.widgetGroup} /* SoloToDoWidget */,`
  );
}

// ─── 4. Add Widget Target Sources Build Phase ────────────────
const sourcesEnd = '/* End PBXSourcesBuildPhase section */';
const widgetSourcesPhase = `\t\t${UUIDS.widgetSourcesPhase} /* Sources */ = {
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
${SWIFT_FILES.map(f => `\t\t\t\t${f.buildId} /* ${f.name} in Sources */,`).join('\n')}
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};`;

pbxproj = pbxproj.replace(sourcesEnd, widgetSourcesPhase + '\n' + sourcesEnd);

// ─── 5. Add Frameworks and Resources Build Phases ────────────
const frameworksEnd = '/* End PBXFrameworksBuildPhase section */';
const widgetFrameworksPhase = `\t\t${UUIDS.widgetFrameworkPhase} /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};`;
pbxproj = pbxproj.replace(frameworksEnd, widgetFrameworksPhase + '\n' + frameworksEnd);

const resourcesEnd = '/* End PBXResourcesBuildPhase section */';
if (pbxproj.includes(resourcesEnd)) {
  const widgetResourcesPhase = `\t\t${UUIDS.widgetResourcesPhase} /* Resources */ = {
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};`;
  pbxproj = pbxproj.replace(resourcesEnd, widgetResourcesPhase + '\n' + resourcesEnd);
}

// ─── 6. Add Embed App Extensions Copy Phase to main App ──────
const copyFilesEnd = '/* End PBXCopyFilesBuildPhase section */';
const embedPhase = `\t\t${UUIDS.embedPhase} /* Embed App Extensions */ = {
\t\t\tisa = PBXCopyFilesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tdstPath = "";
\t\t\tdstSubfolderSpec = 13;
\t\t\tfiles = (
\t\t\t\t${UUIDS.embedProductRef} /* SoloToDoWidgetExtension.appex in Embed App Extensions */,
\t\t\t);
\t\t\tname = "Embed App Extensions";
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};`;

if (pbxproj.includes(copyFilesEnd)) {
  pbxproj = pbxproj.replace(copyFilesEnd, embedPhase + '\n' + copyFilesEnd);
} else {
  // If no PBXCopyFilesBuildPhase section exists, add before End PBXNativeTarget
  pbxproj = pbxproj.replace(
    '/* End PBXNativeTarget section */',
    `/* End PBXCopyFilesBuildPhase section */\n\n${embedPhase}\n\n/* End PBXNativeTarget section */`
  );
}

// Add embed phase to main App target's buildPhases
pbxproj = pbxproj.replace(
  /(\/\* App \*\/ = \{[^}]*buildPhases = \(\s*(?:[^)]*?))((\s*\);))/s,
  `$1\t\t\t\t${UUIDS.embedPhase} /* Embed App Extensions */,\n$2`
);

// ─── 7. Add Widget Native Target ─────────────────────────────
const nativeTargetEnd = '/* End PBXNativeTarget section */';
const widgetTarget = `\t\t${UUIDS.widgetTarget} /* SoloToDoWidgetExtension */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = ${UUIDS.widgetConfigList} /* Build configuration list for PBXNativeTarget "SoloToDoWidgetExtension" */;
\t\t\tbuildPhases = (
\t\t\t\t${UUIDS.widgetSourcesPhase} /* Sources */,
\t\t\t\t${UUIDS.widgetFrameworkPhase} /* Frameworks */,
\t\t\t\t${UUIDS.widgetResourcesPhase} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = SoloToDoWidgetExtension;
\t\t\tproductName = SoloToDoWidgetExtension;
\t\t\tproductReference = ${UUIDS.widgetProduct} /* SoloToDoWidgetExtension.appex */;
\t\t\tproductType = "com.apple.product-type.app-extension";
\t\t};`;

pbxproj = pbxproj.replace(nativeTargetEnd, widgetTarget + '\n' + nativeTargetEnd);

// ─── 8. Add Target Dependency + Proxy ────────────────────────
const containerProxyEnd = '/* End PBXContainerItemProxy section */';
const containerProxy = `\t\t${UUIDS.targetProxy} /* PBXContainerItemProxy */ = {
\t\t\tisa = PBXContainerItemProxy;
\t\t\tcontainerPortal = 504EC2FC1FED79650016851F /* Project object */;
\t\t\tproxyType = 1;
\t\t\tremoteGlobalIDString = ${UUIDS.widgetTarget};
\t\t\tremoteInfo = SoloToDoWidgetExtension;
\t\t};`;

if (pbxproj.includes(containerProxyEnd)) {
  pbxproj = pbxproj.replace(containerProxyEnd, containerProxy + '\n' + containerProxyEnd);
}

const targetDepEnd = '/* End PBXTargetDependency section */';
const targetDep = `\t\t${UUIDS.targetDependency} /* PBXTargetDependency */ = {
\t\t\tisa = PBXTargetDependency;
\t\t\ttarget = ${UUIDS.widgetTarget} /* SoloToDoWidgetExtension */;
\t\t\ttargetProxy = ${UUIDS.targetProxy} /* PBXContainerItemProxy */;
\t\t};`;

if (pbxproj.includes(targetDepEnd)) {
  pbxproj = pbxproj.replace(targetDepEnd, targetDep + '\n' + targetDepEnd);
}

// Add dependency to App target
pbxproj = pbxproj.replace(
  /(\/\* App \*\/ = \{[^}]*dependencies = \(\s*(?:[^)]*?))((\s*\);))/s,
  `$1\t\t\t\t${UUIDS.targetDependency} /* PBXTargetDependency */,\n$2`
);

// ─── 9. Add Build Configuration for Widget Target ────────────
const configListEnd = '/* End XCConfigurationList section */';
const widgetBuildSettings = `\t\t\tbuildSettings = {
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ANALYZER_NONNULL = YES;
\t\t\t\tCODE_SIGN_ENTITLEMENTS = SoloToDoWidget/SoloToDoWidget.entitlements;
\t\t\t\tCODE_SIGN_STYLE = Manual;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = SoloToDoWidget/Info.plist;
\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = "SoloToDo Widget";
\t\t\t\tINFOPLIST_KEY_NSHumanReadableCopyright = "";
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks";
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.solotodo.app.widget;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSKIP_INSTALL = YES;
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};`;

const widgetConfigDebug = `\t\t${UUIDS.widgetConfigDebug} /* Debug */ = {
\t\t\tisa = XCBuildConfiguration;
${widgetBuildSettings}
\t\t\tname = Debug;
\t\t};`;

const widgetConfigRelease = `\t\t${UUIDS.widgetConfigRelease} /* Release */ = {
\t\t\tisa = XCBuildConfiguration;
${widgetBuildSettings}
\t\t\tname = Release;
\t\t};`;

const configEnd = '/* End XCBuildConfiguration section */';
pbxproj = pbxproj.replace(configEnd, widgetConfigDebug + '\n' + widgetConfigRelease + '\n' + configEnd);

// Add configuration list for widget target
const widgetConfigList = `\t\t${UUIDS.widgetConfigList} /* Build configuration list for PBXNativeTarget "SoloToDoWidgetExtension" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t${UUIDS.widgetConfigDebug} /* Debug */,
\t\t\t\t${UUIDS.widgetConfigRelease} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};`;

pbxproj = pbxproj.replace(configListEnd, widgetConfigList + '\n' + configListEnd);

// ─── 10. Add Widget Target to PBXProject targets ─────────────
pbxproj = pbxproj.replace(
  /(targets = \(\s*504EC3041FED79650016851F \/\* App \*\/,?)/,
  `$1\n\t\t\t\t${UUIDS.widgetTarget} /* SoloToDoWidgetExtension */,`
);

// ─── Write the patched file ──────────────────────────────────
fs.writeFileSync(PBXPROJ_PATH, pbxproj, 'utf-8');
console.log('[Widget Patch] ✅ Successfully patched project.pbxproj!');
console.log('[Widget Patch]    - Added SoloToDoWidgetExtension target');
console.log('[Widget Patch]    - Added 7 Swift source files');
console.log('[Widget Patch]    - Added Embed App Extensions phase');
console.log('[Widget Patch]    - Added build configurations');
console.log('[Widget Patch]    - Bundle ID: com.solotodo.app.widget');
