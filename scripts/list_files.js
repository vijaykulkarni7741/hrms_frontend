const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'src', 'app');

function getFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else {
      files.push(name);
    }
  }
  return files;
}

const allFiles = getFiles(root).filter(f => f.endsWith('.ts'));
console.log('Total TS files:', allFiles.length);
allFiles.forEach(f => console.log(path.relative(root, f)));
