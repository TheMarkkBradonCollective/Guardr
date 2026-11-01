import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targets = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.ts') && path.includes('/api/')) targets.push(path);
  }
}

walk(join(root, 'api'));

const fnRe = /\nasync function getSupabaseAdmin\(\)[\s\S]*?\n\}\n/;

for (const file of targets) {
  let text = readFileSync(file, 'utf8');
  if (!fnRe.test(text)) continue;
  text = text.replace(fnRe, '\n');
  if (!text.includes('adminClient')) {
    const depth = file.split('/').length - 2;
    const prefix = '../'.repeat(depth - 1);
    text = `import { getSupabaseAdmin } from '${prefix}lib/db/adminClient.ts';\n${text}`;
  }
  writeFileSync(file, text);
  console.log('patched', file);
}
