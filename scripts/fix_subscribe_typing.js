// scripts/fix_subscribe_typing.js
const fs = require('fs');
const path = require('path');

const featuresDir = path.resolve('src/app/features');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/\.subscribe\(res =>/g, '.subscribe((res: any) =>');
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Fixed typing in ${filePath}`);
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.component.ts')) {
      fixFile(full);
    }
  }
}

walk(featuresDir);
console.log('All subscribe typings updated.');
