import { icons } from 'lucide';
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('src/lib/categoryIcons.tsx', 'utf8');

// Find iconMap content by matching between { and the last } before the semicolon
const start = content.indexOf('iconMap: Record<string, LucideIcon> = {');
const bodyStart = content.indexOf('{', start) + 1;
let depth = 1;
let i = bodyStart;
while (depth > 0 && i < content.length) {
  if (content[i] === '{') depth++;
  if (content[i] === '}') depth--;
  i++;
}
const mapContent = content.slice(bodyStart, i - 1);

const keys = [
  ...mapContent.matchAll(/'([^']+)'\s*:/g),
  ...mapContent.matchAll(/(?<=^|\s|,)([a-z][a-z0-9-]*)\s*:/g),
].map(m => m[1]).filter(k => k !== 'Record' && k !== 'string');
console.log('Found', keys.length, 'icons:', keys);

const iconPaths = {};
for (const key of keys) {
  const pascal = key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const icon = icons[pascal];
  if (!icon) {
    console.log('  NOT FOUND:', key, '->', pascal);
    continue;
  }
  const svgContent = icon.map(node => {
    const [tag, attrs] = node;
    const attrStr = Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('');
    return `<${tag}${attrStr}/>`;
  }).join('');
  iconPaths[key] = svgContent;
}

const output = '// Auto-generated from lucide icons\n' +
  '// Run: node scripts/extract-icon-paths.mjs\n' +
  'export const ICON_SVG_PATHS: Record<string, string> = ' +
  JSON.stringify(iconPaths, null, 2) + ';\n';

writeFileSync('src/lib/iconSvgPaths.ts', output);
console.log('Generated src/lib/iconSvgPaths.ts');
