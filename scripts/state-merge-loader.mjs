// Node loader hook for test-state-merge.mjs: stubs the browser-only
// "../firebase" module (Analytics/AppCheck need a DOM) so data/storage.js
// can be unit-tested in plain Node. Production code is untouched.
const FIREBASE_STUB =
  "export const auth = { currentUser: null };" +
  "export const db = {};" +
  "export const functions = {};";

export function resolve(specifier, context, nextResolve) {
  if (specifier === "../firebase" || specifier === "../firebase.js") {
    return {
      url: `data:text/javascript,${encodeURIComponent(FIREBASE_STUB)}`,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
