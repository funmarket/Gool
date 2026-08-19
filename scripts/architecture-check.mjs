import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const failures = [];

function walk(directory, predicate) {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...walk(fullPath, predicate));
    else if (predicate(fullPath)) output.push(fullPath);
  }
  return output;
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function fail(file, rule, detail) {
  failures.push(`${rel(file)}: ${rule}${detail ? ` (${detail})` : ''}`);
}

const textExtensions = new Set([
  '.cjs',
  '.css',
  '.env',
  '.example',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.prisma',
  '.sql',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
]);

const legacyProductToken = String.fromCharCode(103, 111, 111, 108);
const legacyProductPattern = new RegExp(
  `(^|[^a-z0-9])${legacyProductToken}($|[^a-z0-9])`,
  'i',
);
function hasLegacyProductIdentifier(value) {
  return legacyProductPattern.test(value);
}

const repositoryFiles = walk(root, () => true);
for (const file of repositoryFiles) {
  if (hasLegacyProductIdentifier(rel(file))) {
    fail(file, 'legacy product identifier in path', 'HOOMA is the only active product identity');
  }
}

const repositoryTextFiles = repositoryFiles.filter((file) => {
  const base = path.basename(file);
  if (base.startsWith('.env')) return true;
  return textExtensions.has(path.extname(file).toLowerCase());
});
for (const file of repositoryTextFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (hasLegacyProductIdentifier(source)) {
    fail(file, 'legacy product identifier', 'HOOMA is the only active product identity');
  }
}

const runtimeFiles = [
  ...walk(path.join(root, 'apps'), (file) => /\.(?:ts|tsx|js|mjs|json)$/.test(file)),
  ...walk(path.join(root, 'packages'), (file) => /\.(?:ts|tsx|js|mjs|json|prisma)$/.test(file)),
];

const forbiddenRuntimeTerms = [
  { name: 'Stripe runtime rail', pattern: /\bstripe\b/i },
  { name: 'Flouci runtime rail', pattern: /\bflouci\b/i },
  { name: 'Solana runtime rail', pattern: /\bsolana\b/i },
  { name: 'TON runtime rail', pattern: /\btonconnect\b|\/ton(?:\/|['"`?])/i },
  { name: 'Wallet Pay runtime rail', pattern: /\bwallet\s*pay\b|\bwalletpay\b/i },
];

for (const file of runtimeFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const rule of forbiddenRuntimeTerms) {
    if (rule.pattern.test(source)) fail(file, rule.name, 'not part of Cash + Telegram Stars V1');
  }
  if (/!important\b/.test(source))
    fail(file, 'forbidden !important', 'use the design tokens/cascade');
  if (/z-\[\d+\]/.test(source))
    fail(file, 'arbitrary numeric z-index', 'use semantic layer classes from the design system');
}

const miniappFiles = walk(path.join(root, 'apps/miniapp/src'), (file) =>
  /\.(?:ts|tsx)$/.test(file),
);
for (const file of miniappFiles) {
  if (rel(file) === 'apps/miniapp/src/shared/api/http-client.ts') continue;
  if (/\bfetch\s*\(/.test(fs.readFileSync(file, 'utf8'))) {
    fail(file, 'scattered fetch', 'use shared/api/http-client.ts');
  }
}

const apiModuleFiles = walk(path.join(root, 'apps/api/src/modules'), (file) => /\.ts$/.test(file));
for (const file of apiModuleFiles) {
  const relative = rel(file);
  if (relative.includes('/infrastructure/')) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (/@hooma\/database|@prisma\/client|\bPrismaClient\b/.test(source)) {
    fail(file, 'database dependency outside infrastructure', 'use a repository port');
  }
}

for (const packageFile of walk(root, (file) => path.basename(file) === 'package.json')) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const [name, version] of Object.entries(pkg[section] ?? {})) {
      if (version === 'latest') fail(packageFile, 'unpinned dependency', `${name}=latest`);
    }
  }
}

const appRouterPath = path.join(root, 'apps/miniapp/src/App.tsx');
const appRouterSource = fs.readFileSync(appRouterPath, 'utf8');
if (/^\s*import\s+.+\s+from\s+['"]\.\/pages\//m.test(appRouterSource)) {
  fail(
    appRouterPath,
    'eager Mini App route import',
    'feature pages must remain route-level lazy imports',
  );
}

const schemaPath = path.join(root, 'packages/database/prisma/schema.prisma');
const schema = fs.readFileSync(schemaPath, 'utf8');
const paymentMethodEnum = schema.match(/enum\s+PaymentMethod\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const paymentMethods = paymentMethodEnum
  .split(/\s+/)
  .map((value) => value.trim())
  .filter(Boolean);
if (paymentMethods.join(',') !== 'CASH,TELEGRAM_STARS') {
  fail(schemaPath, 'unexpected V1 payment method', paymentMethods.join(',') || 'missing enum');
}

const providerEnum = schema.match(/enum\s+PaymentProvider\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const providers = providerEnum
  .split(/\s+/)
  .map((value) => value.trim())
  .filter(Boolean);
if (providers.join(',') !== 'TELEGRAM') {
  fail(schemaPath, 'unexpected external provider', providers.join(',') || 'missing enum');
}

if (failures.length) {
  console.error(`Architecture check failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Architecture check passed: HOOMA naming and Cash + Telegram Stars boundaries are intact.');
