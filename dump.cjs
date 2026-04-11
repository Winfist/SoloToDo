const { execSync } = require('child_process');
try {
  const output = execSync('npx firebase hosting:sites:list --json', { encoding: 'utf-8' });
  require('fs').writeFileSync('sites.json', output);
} catch (e) {
  require('fs').writeFileSync('sites.json', e.stdout || e.toString());
}
