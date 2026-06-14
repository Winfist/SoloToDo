// Guards against dangling "/icons/*" literals after asset renames
// (e.g. shadow_* → phantom_*). Scans source for icon-path string literals
// and asserts the file exists under public/.
import fs from "fs";
import path from "path";

const ROOTS = ["components", "data", "hooks", "services", "multiplayer", "contexts"];
const ROOT_FILES = ["solo-leveling-v5.jsx", "StoryView.jsx", "AuthScreen.jsx", "main.jsx"];

const files = ROOT_FILES.filter(f => fs.existsSync(f));
const walk = dir => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const fp = path.join(dir, entry);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (/\.(jsx?|mjs)$/.test(entry)) files.push(fp);
  }
};
ROOTS.forEach(walk);

let failures = 0;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const match of src.matchAll(/["'`](\/icons\/[A-Za-z0-9_\-./]+\.(?:webp|png|svg|jpg))["'`]/g)) {
    const iconPath = match[1];
    if (!fs.existsSync(path.join("public", iconPath))) {
      console.error(`FAIL: ${file} references missing icon ${iconPath}`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} dangling icon reference(s).`);
  process.exit(1);
}
console.log(`All icon paths resolve (${files.length} files scanned).`);
