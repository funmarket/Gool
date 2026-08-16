import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import process from 'node:process';

const distDir = resolve(process.cwd(), 'dist');
const indexPath = resolve(distDir, 'index.html');
const html = readFileSync(indexPath, 'utf8');
const entryMatch = html.match(/<script[^>]+src=["']\/?([^"']+\.js)["'][^>]*><\/script>/i);
const initialLimitBytes = 500_000;
const lazyChunkLimitBytes = 1_000_000;
const kb = (bytes) => (bytes / 1000).toFixed(1);

if (!entryMatch) {
  console.error(
    'Mini App bundle budget failed: unable to locate the entry JavaScript in dist/index.html.',
  );
  process.exit(1);
}

function javaScriptAssets(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...javaScriptAssets(fullPath));
    else if (extname(entry.name) === '.js') files.push(fullPath);
  }
  return files;
}

const entryPath = resolve(distDir, entryMatch[1]);
const entryBytes = statSync(entryPath).size;
const oversizedLazyChunks = javaScriptAssets(distDir)
  .filter((file) => file !== entryPath)
  .map((file) => ({ file, bytes: statSync(file).size }))
  .filter(({ bytes }) => bytes > lazyChunkLimitBytes)
  .sort((a, b) => b.bytes - a.bytes);

if (entryBytes > initialLimitBytes || oversizedLazyChunks.length) {
  console.error(
    `Mini App bundle budget failed: initial JavaScript must be <= ${kb(initialLimitBytes)} kB raw and lazy chunks must be <= ${kb(lazyChunkLimitBytes)} kB raw.`,
  );
  if (entryBytes > initialLimitBytes) {
    console.error(`- ${relative(distDir, entryPath)}: ${kb(entryBytes)} kB (initial)`);
  }
  for (const asset of oversizedLazyChunks) {
    console.error(`- ${relative(distDir, asset.file)}: ${kb(asset.bytes)} kB`);
  }
  process.exit(1);
}

console.log(
  `Mini App bundle budget passed: entry ${kb(entryBytes)} kB <= ${kb(initialLimitBytes)} kB; lazy chunks <= ${kb(lazyChunkLimitBytes)} kB raw.`,
);
