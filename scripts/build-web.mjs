import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function buildWeb() {
  const out = join(root, 'dist');
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  // Explicit allowlist: never package git, environment files, signing keys or node_modules.
  for (const path of ['index.html', 'src', 'vendor', 'LICENSE']) {
    await cp(join(root, path), join(out, path), { recursive: true });
  }
  let html = await readFile(join(out, 'index.html'), 'utf8');
  // Android has no dependency on Google Fonts. Local licensed Vazirmatn is tracked in #35.
  html = html.replace(/<link\b[^>]*href="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>\s*/g, '');
  const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-src 'none'";
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">');
  await writeFile(join(out, 'index.html'), html);
  const manifest = {};
  async function walk(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) manifest[relative(out, path).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(path)).digest('hex');
      else throw new Error('Unsupported asset: ' + path);
    }
  }
  await walk(out);
  await writeFile(join(out, 'asset-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = await buildWeb();
  console.log('Built ' + Object.keys(manifest).length + ' local assets in dist/');
}
