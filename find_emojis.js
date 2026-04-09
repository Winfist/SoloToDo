const fs = require('fs');
const path = require('path');

const emojiRegex = /\p{Emoji_Presentation}|[⭐☄️⚔️🛡️🔥🧊⚡🌪️☠️]/gu;

function scanDir(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (let file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file.startsWith('.')) continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(scanDir(fullPath));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, i) => {
                if (emojiRegex.test(line)) {
                    results.push(`${file}:${i + 1}: ${line.trim()}`);
                }
            });
        }
    }
    return results;
}

const res = scanDir('c:\\Users\\jwuck\\OneDrive\\Dokumente\\SoloToDo');
fs.writeFileSync('c:\\Users\\jwuck\\OneDrive\\Dokumente\\SoloToDo\\emoji_results.txt', res.join('\n'));
console.log('Found', res.length, 'lines with emojis');
