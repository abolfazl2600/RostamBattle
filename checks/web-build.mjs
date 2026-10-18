import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { buildWeb, root } from '../scripts/build-web.mjs';

const original = await readFile(join(root, 'index.html'), 'utf8');
const first = await buildWeb();
await writeFile(join(root, 'dist', 'stale-secret.txt'), 'must not ship');
const second = await buildWeb();
assert.deepEqual(first, second, 'Build must be deterministic and discard stale output');
assert.equal(await readFile(join(root, 'index.html'), 'utf8'), original, 'Web entry must remain unchanged');
const html = await readFile(join(root, 'dist/index.html'), 'utf8');
assert(!/https:\/\/fonts\.(googleapis|gstatic)\.com/.test(html));
assert(html.includes("connect-src 'self'"));
assert(html.includes('ROSTAM_WEBVIEW_UPGRADE_REQUIRED'), 'Android WebView fallback marker must be bundled');
assert(html.includes('ROSTAM_TITLE_VISIBLE'), 'Android title readiness marker must be bundled');
assert(!html.includes('<script type="module" src="./src/main.js"></script>'), 'Android module entry must run only after compatibility check');
for (const path of ['index.html', 'src/main.js', 'src/ui/title.css', 'vendor/three/three.module.js', 'src/ui/brush.woff2', 'LICENSE']) assert(second[path], 'Missing ' + path);
for (const path of Object.keys(second)) assert(!/(^|\/)(?:node_modules|\.git|\.env)|\.(?:jks|keystore)$/.test(path), 'Private file packaged: ' + path);
assert(!second['stale-secret.txt']);

// Resolve the module graph independently of a browser, including vendor transitive imports.
const imports = JSON.parse(html.match(/<script type="importmap">\s*([\s\S]*?)<\/script>/)[1]).imports;
function resolve(specifier, from) {
  if (specifier.startsWith('.')) return posix.normalize(posix.join(posix.dirname(from), specifier));
  if (imports[specifier]) return imports[specifier].replace(/^\.\//, '');
  const prefix = Object.keys(imports).find(key => key.endsWith('/') && specifier.startsWith(key));
  assert(prefix, 'Unknown module ' + specifier + ' from ' + from);
  return imports[prefix].replace(/^\.\//, '') + specifier.slice(prefix.length);
}
for (const path of Object.keys(second).filter(path => path.endsWith('.js'))) {
  const source = await readFile(join(root, 'dist', path), 'utf8');
  const refs = [...source.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g)];
  for (const [, specifier] of refs) {
    assert(!/^https?:|^\/\//.test(specifier), 'Remote runtime import: ' + specifier);
    assert(second[resolve(specifier, path)], 'Missing module ' + specifier + ' imported by ' + path);
  }
}
console.log('PASS: deterministic package, clean output, unchanged web entry, local module graph');
