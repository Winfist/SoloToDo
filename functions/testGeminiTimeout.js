const assert = require("node:assert/strict");
const { callGemini } = require("./geminiService");

const originalFetch = global.fetch;
const originalKey = process.env.OPENROUTER_API_KEY;
process.env.OPENROUTER_API_KEY = "test-only";

global.fetch = (_url, options = {}) => new Promise((_resolve, reject) => {
  options.signal.addEventListener("abort", () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    reject(error);
  }, { once: true });
});

(async () => {
  let caught = null;
  try {
    await callGemini({ system: "system", user: "user" }, {
      maxAttempts: 1,
      redactErrors: true,
      timeoutMs: 100,
    });
  } catch (error) {
    caught = error;
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalKey;
  }
  assert(caught, "provider timeout must reject");
  assert.equal(caught.code, "deadline-exceeded");
  console.log("testGeminiTimeout: all assertions passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
