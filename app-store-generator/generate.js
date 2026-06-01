import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceDir = 'C:/Users/jwuck/OneDrive/Dokumente/SoloToDo/arise-ad';
const screenshotsDir = path.join(workspaceDir, 'renders/Screenshots');
const assetsDir = path.join(workspaceDir, 'assets');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// ---------------------------------------------------------
// HIER KANNST DU DIE SCREENSHOTS ZU DEN TEXTEN ZUORDNEN
// Ändere einfach die Dateinamen (z.B. 'IMG_1139.PNG'), 
// wenn das Bild nicht zum Text passt!
// ---------------------------------------------------------
const screenshotMap = {
  dashboard: 'IMG_1139.PNG', // Bild 1: "Level Up Dein Leben" (Hauptmenü)
  quests:    'IMG_1140.PNG', // Bild 2: "Sammle XP" (Aufgaben/Quests)
  boss:      'IMG_1141.PNG', // Bild 3: "Besiege die Prokrastination" (Endboss/Tagesziele)
  shadows:   'IMG_1142.PNG', // Bild 4: "Erwecke deine Schatten" (Schattenarmee)
  stats:     'IMG_1143.PNG', // Bild 5: "Maximiere Deine Stats" (Profil/Stats)
  skills:    'IMG_1144.PNG', // Bild 6: "Schalte neue Skills frei" (Fähigkeiten)
  final:     'IMG_1145.PNG'  // Bild 7: "Rise & Grind" (Beliebiges episches Bild)
};

// Helper function to resolve paths
const getImg = (name) => path.join(screenshotsDir, screenshotMap[name]).replace(/\\/g, '/');

// Ultra-Premium Spreads (Panoramas)
const spreads = [
  {
    layout: 'layout-split-center',
    imgA: getImg('dashboard'), imgB: getImg('quests'),
    titleA: "Level Up\nDein Leben", subA: "Verwandle tägliche Aufgaben\nin epische Quests.",
    titleB: "Sammle XP\n& Loot", subB: "Werde der beste Player\ndeines eigenen Alltags.",
    bg: path.join(assetsDir, 'bg_portal.png').replace(/\\/g, '/'),
    out1: 1, out2: 2
  },
  {
    layout: 'layout-split-overlap',
    imgA: getImg('boss'), imgB: getImg('shadows'),
    titleA: "Besiege die\nProkrastination", subA: "Stelle dich dem Endboss.",
    titleB: "Erwecke deine\nSchatten", subB: "Produktivität auf\ndem höchsten Level.",
    bg: path.join(assetsDir, 'quest_bg_boss.png').replace(/\\/g, '/'),
    out1: 3, out2: 4
  },
  {
    layout: 'layout-split-center',
    imgA: getImg('stats'), imgB: getImg('skills'),
    titleA: "Maximiere\nDeine Stats", subA: "Intelligenz, Stärke und\nVitalität steigern.",
    titleB: "Schalte neue\nSkills frei", subB: "Verfolge deinen Fortschritt\nin Echtzeit.",
    bg: path.join(assetsDir, 'bg_cyberpunk.png').replace(/\\/g, '/'),
    out1: 5, out2: 6
  },
  {
    layout: 'layout-single',
    imgA: getImg('final'), imgB: getImg('final'), // B will be hidden by CSS
    titleA: "SoloToDo.\nRise & Grind.", subA: "Dein Abenteuer beginnt jetzt.",
    titleB: "", subB: "",
    bg: path.join(assetsDir, 'bg_dungeon.png').replace(/\\/g, '/'),
    out1: 7, out2: null // Null means only clip the left side!
  }
];

// Apple required dimensions (Width is for a single screen)
const sizes = [
  { name: '6.7', screenWidth: 1290, screenHeight: 2796 },
  { name: '6.5', screenWidth: 1242, screenHeight: 2688 }
];

(async () => {
  console.log('Starte Browser für nahtlose Panorama-Generierung...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const templatePath = `file://${path.join(__dirname, 'template.html').replace(/\\/g, '/')}`;

  for (const spread of spreads) {
    console.log(`Verarbeite Spread: ${spread.layout} (Output: ${spread.out1}${spread.out2 ? ` & ${spread.out2}` : ''})`);
    
    await page.goto(templatePath, { waitUntil: 'networkidle0' });
    
    // Inject data into DOM
    await page.evaluate((data) => {
      document.getElementById('body-layout').className = data.layout;
      document.getElementById('glow').style.backgroundImage = `url('file://${data.bg}')`;
      
      document.getElementById('img-a').src = `file://${data.imgA}`;
      document.getElementById('img-b').src = `file://${data.imgB}`;
      
      document.getElementById('title-a').innerText = data.titleA;
      document.getElementById('sub-a').innerText = data.subA;
      document.getElementById('title-b').innerText = data.titleB;
      document.getElementById('sub-b').innerText = data.subB;
    }, spread);

    // Wait for images to load completely
    await page.waitForFunction(() => {
      const imgA = document.getElementById('img-a');
      const imgB = document.getElementById('img-b');
      return imgA.complete && imgB.complete && imgA.naturalHeight !== 0;
    });

    for (const size of sizes) {
      // The canvas is exactly 2 screens wide
      const canvasWidth = size.screenWidth * 2;
      const canvasHeight = size.screenHeight;
      
      await page.setViewport({ width: canvasWidth, height: canvasHeight, deviceScaleFactor: 1 });
      
      // Wait for layout recalculation
      await new Promise(r => setTimeout(r, 600));
      
      // 1. Screenshot of the Left Half
      const pathLeft = path.join(outputDir, `AppStore_${size.name}_${spread.out1}.png`);
      await page.screenshot({ 
        path: pathLeft, 
        clip: { x: 0, y: 0, width: size.screenWidth, height: size.screenHeight } 
      });
      console.log(` -> Gespeichert (Links): ${pathLeft}`);

      // 2. Screenshot of the Right Half (If spread has a second output)
      if (spread.out2) {
        const pathRight = path.join(outputDir, `AppStore_${size.name}_${spread.out2}.png`);
        await page.screenshot({ 
          path: pathRight, 
          clip: { x: size.screenWidth, y: 0, width: size.screenWidth, height: size.screenHeight } 
        });
        console.log(` -> Gespeichert (Rechts): ${pathRight}`);
      }
    }
  }

  await browser.close();
  console.log("Fertig! Die Screenshots wurden generiert.");
})();
