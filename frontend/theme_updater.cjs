const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'components', 'SellerDashboard');

const replacements = [
  // Backgrounds
  { pattern: /(?<!dark:)bg-slate-900(?!\/)/g, replacement: 'bg-white dark:bg-slate-900' },
  { pattern: /(?<!dark:)bg-slate-950(?!\/)/g, replacement: 'bg-slate-50 dark:bg-slate-950' },
  { pattern: /(?<!dark:)bg-slate-800(?!\/)/g, replacement: 'bg-slate-100 dark:bg-slate-800' },
  { pattern: /(?<!dark:)bg-slate-900\/50/g, replacement: 'bg-slate-100/50 dark:bg-slate-900/50' },
  { pattern: /(?<!dark:)bg-slate-950\/50/g, replacement: 'bg-slate-50/50 dark:bg-slate-950/50' },
  { pattern: /(?<!dark:)bg-slate-800\/50/g, replacement: 'bg-slate-100/50 dark:bg-slate-800/50' },
  { pattern: /(?<!dark:)hover:bg-slate-800\/20/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-800/20' },
  { pattern: /(?<!dark:)hover:bg-slate-800/g, replacement: 'hover:bg-slate-100 dark:hover:bg-slate-800' },

  // Borders
  { pattern: /(?<!dark:)border-slate-800/g, replacement: 'border-slate-200 dark:border-slate-800' },
  { pattern: /(?<!dark:)border-slate-700/g, replacement: 'border-slate-300 dark:border-slate-700' },
  { pattern: /(?<!dark:)divide-slate-800/g, replacement: 'divide-slate-200 dark:divide-slate-800' },

  // Text colors
  { pattern: /(?<!dark:)text-slate-100/g, replacement: 'text-slate-900 dark:text-slate-100' },
  { pattern: /(?<!dark:)text-slate-200/g, replacement: 'text-slate-800 dark:text-slate-200' },
  { pattern: /(?<!dark:)text-slate-300/g, replacement: 'text-slate-800 dark:text-slate-300' },
  { pattern: /(?<!dark:)text-slate-400/g, replacement: 'text-slate-500 dark:text-slate-400' },
  // text-slate-500 usually is fine in both modes, but if we need:
  // { pattern: /(?<!dark:)text-slate-500/g, replacement: 'text-slate-600 dark:text-slate-500' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  });
}

traverseDirectory(directoryPath);
console.log('Done!');
