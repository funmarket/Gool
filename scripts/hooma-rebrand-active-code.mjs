import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const checkOnly = process.argv.includes('--check');
const legacyScope = '@' + 'gool/';
const currentScope = '@hooma/';
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const scanRoots = ['apps/api/src', 'apps/miniapp/src', 'tests', 'scripts'];
const excludedFiles = new Set(['scripts/hooma-rebrand-active-code.mjs']);

function walk(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) return [];
  const files = [];
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...walk(relativePath));
    else files.push(relativePath);
  }
  return files;
}

const files = scanRoots
  .flatMap(walk)
  .filter((file) => allowedExtensions.has(path.extname(file)))
  .filter((file) => !excludedFiles.has(file.split(path.sep).join('/')));

const changed = [];
const remaining = [];

for (const relativeFile of files) {
  const absoluteFile = path.join(root, relativeFile);
  const source = fs.readFileSync(absoluteFile, 'utf8');
  if (!source.includes(legacyScope)) continue;

  if (checkOnly) {
    remaining.push(relativeFile.split(path.sep).join('/'));
    continue;
  }

  const next = source.split(legacyScope).join(currentScope);
  if (next !== source) {
    fs.writeFileSync(absoluteFile, next, 'utf8');
    changed.push(relativeFile.split(path.sep).join('/'));
  }
}

if (checkOnly) {
  if (remaining.length) {
    console.error('Legacy @gool workspace imports remain in active code:');
    for (const file of remaining) console.error(`- ${file}`);
    process.exit(1);
  }
  console.log('Active-code namespace check passed: no @gool workspace imports remain.');
  process.exit(0);
}

console.log(`Updated ${changed.length} active source file(s) from @gool/* to @hooma/*.`);
for (const file of changed) console.log(`- ${file}`);
