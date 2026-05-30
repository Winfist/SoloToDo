import { generateOperationStep } from "../data/helpers.js";
import { OPERATIONS } from "../data/questPool.js";

// Verify operations and translation
const op = OPERATIONS.find(o => o.id === "op_dawn_disciplin");
if (!op) {
  console.error("Operation not found");
  process.exit(1);
}

// Generate steps for German (default)
const step1De = generateOperationStep(op, 1, "de");
const step2De = generateOperationStep(op, 2, "de");
const step3De = generateOperationStep(op, 3, "de");

if (step1De.title !== "Morgenroutine Stufe 1: Aufstehen vor 6:30 Uhr und 5 Min Stretching") {
  console.error("German title for step 1 incorrect:", step1De.title);
  process.exit(1);
}
if (step1De.desc !== "Etabliere eine unerschuetterliche Morgenroutine fuer maximale Effizienz.") {
  console.error("German description incorrect:", step1De.desc);
  process.exit(1);
}
if (step1De.chainStep !== 1 || step1De.chainTotal !== 3) {
  console.error("Chained properties incorrect:", step1De);
  process.exit(1);
}

// Generate steps for English
const step1En = generateOperationStep(op, 1, "en");
if (step1En.title !== "Morning Routine Stage 1: Wake up before 6:30 AM and 5 min stretching") {
  console.error("English title for step 1 incorrect:", step1En.title);
  process.exit(1);
}
if (step1En.desc !== "Establish an unshakeable morning routine for maximum efficiency.") {
  console.error("English description incorrect:", step1En.desc);
  process.exit(1);
}

console.log("✓ Operations: generateOperationStep works for DE and EN");
