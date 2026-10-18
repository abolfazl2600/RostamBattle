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
  // Android-only capability check. API level does not guarantee a sufficiently
  // recent System WebView: import maps are needed for Three.js bare specifiers,
  // and older WebViews cannot parse optional chaining in the game's modules.
  // Keep the normal browser entry untouched.
  const originalEntry = '<script type="module" src="./src/main.js"></script>';
  if (!html.includes(originalEntry)) throw new Error('Missing Android module bootstrap anchor');
  const nativeEntry = `<script>
(function() {
  var supported = !!(window.HTMLScriptElement && HTMLScriptElement.supports &&
    HTMLScriptElement.supports('importmap'));
  if (!supported) {
    document.body.setAttribute('data-native-webview', 'unsupported');
    console.warn('ROSTAM_WEBVIEW_UPGRADE_REQUIRED');
    var wait = document.querySelector('#ink.boot .ink-wait');
    if (wait) wait.innerHTML = '<p>نسخه WebView دستگاه قدیمی است<small>برای اجرای نبرد رستم، Android System WebView یا Chrome را به‌روزرسانی کنید.</small></p>';
    return;
  }
  document.body.setAttribute('data-native-webview', 'supported');
  console.log('ROSTAM_WEBVIEW_IMPORTMAP_SUPPORTED');
  var startedAt = Date.now();
  var check = setInterval(function() {
    var title = document.getElementById('title');
    if (title && !title.hidden) {
      console.log('ROSTAM_TITLE_VISIBLE');
      clearInterval(check);
    } else if (Date.now() - startedAt > 40000) {
      console.error('ROSTAM_TITLE_TIMEOUT');
      clearInterval(check);
    }
  }, 300);
  var script = document.createElement('script');
  script.type = 'module';
  script.src = './src/main.js';
  document.body.appendChild(script);
})();
</script>`;
  html = html.replace(originalEntry, nativeEntry);
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
