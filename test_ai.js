import { initializeApp } from "firebase/app";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";

// Mock Firebase Config
const firebaseConfig = {
  projectId: "solo-todo",
  apiKey: "fake-api-key",
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, "europe-west1");
connectFunctionsEmulator(functions, "127.0.0.1", 5001);

async function runTests() {
  console.log("🚀 Starte AI Subsystem Test-Suite...");
  
  try {
    const generateQuestDescription = httpsCallable(functions, "generateQuestDescription");
    console.log("\n[1/6] Teste generateQuestDescription...");
    const res1 = await generateQuestDescription({ title: "Zimmer aufräumen", category: "vit" });
    console.log("✅ Erfolg:", JSON.stringify(res1.data, null, 2));
  } catch (e) {
    console.error("❌ Fehler bei generateQuestDescription:", e.message);
  }

  try {
    const generateSystemMessage = httpsCallable(functions, "generateSystemMessage");
    console.log("\n[2/6] Teste generateSystemMessage...");
    const res2 = await generateSystemMessage({
      context: "User war 3 Tage offline.",
      messageType: "motivation",
      hunterName: "TestHunter",
      stats: { str: 10, int: 5 },
      streak: 0
    });
    console.log("✅ Erfolg:", JSON.stringify(res2.data, null, 2));
  } catch (e) {
    console.error("❌ Fehler bei generateSystemMessage:", e.message);
  }

  try {
    const askCoach = httpsCallable(functions, "askCoach");
    console.log("\n[3/6] Teste askCoach...");
    const res3 = await askCoach({
      question: "Welchen Stat sollte ich leveln?",
      hunterName: "TestHunter",
      stats: { str: 20, int: 2 },
      level: 5,
      streak: 2,
      openQuests: []
    });
    console.log("✅ Erfolg:", JSON.stringify(res3.data, null, 2));
  } catch (e) {
    console.error("❌ Fehler bei askCoach:", e.message);
  }

  try {
    const generateDynamicQuests = httpsCallable(functions, "generateDynamicQuests");
    console.log("\n[4/6] Teste generateDynamicQuests...");
    const res4 = await generateDynamicQuests({
      stats: { str: 20, int: 2 },
      level: 5,
      weakestStat: "int",
      recentQuests: ["Pushups"]
    });
    console.log("✅ Erfolg:", JSON.stringify(res4.data, null, 2));
  } catch (e) {
    console.error("❌ Fehler bei generateDynamicQuests:", e.message);
  }

  // Für Bild-Tests brauchen wir einen echten Base64 String - wir nutzen hier einen ungültigen Pixel
  const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  try {
    const verifyQuestPhoto = httpsCallable(functions, "verifyQuestPhoto");
    console.log("\n[5/6] Teste verifyQuestPhoto...");
    const res5 = await verifyQuestPhoto({
      imageBase64: dummyImage,
      mimeType: "image/png",
      questTitle: "Zimmer aufräumen",
      questDesc: ""
    });
    console.log("✅ Erfolg:", JSON.stringify(res5.data, null, 2));
  } catch (e) {
    console.error("❌ Fehler bei verifyQuestPhoto:", e.message);
  }

  try {
    const scanTaskPhoto = httpsCallable(functions, "scanTaskPhoto");
    console.log("\n[6/6] Teste scanTaskPhoto...");
    const res6 = await scanTaskPhoto({
      imageBase64: dummyImage,
      mimeType: "image/png"
    });
    console.log("✅ Erfolg:", JSON.stringify(res6.data, null, 2));
  } catch (e) {
    console.error("❌ Fehler bei scanTaskPhoto:", e.message);
  }
}

runTests();
