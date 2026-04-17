const { callGemini } = require("./geminiService.js");

async function test() {
  console.log("Testing Vertex AI...");
  try {
    const result = await callGemini("Hello, say 'Test successful'.");
    console.log("RESULT:", result);
  } catch (err) {
    console.error("ERROR:");
    console.error(err);
  }
}

test();
