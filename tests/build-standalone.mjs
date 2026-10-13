import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';

const root = resolve('html-export');
const assets = {};
async function collect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) { await collect(path); continue; }
    const ext = extname(path).slice(1);
    if (!['png', 'webp', 'svg'].includes(ext)) continue;
    const key = relative(root, path).replaceAll('\\', '/');
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    assets[key] = `data:${mime};base64,${(await readFile(path)).toString('base64')}`;
  }
}
await collect(resolve(root, 'assets/clean/illustrations'));
await collect(resolve(root, 'assets/icon-preview'));
await collect(resolve(root, 'assets/generated'));
let html = await readFile(resolve(root, 'index.html'), 'utf8');
let css = await readFile(resolve(root, 'workbench.css'), 'utf8');
const js = await readFile(resolve(root, 'workbench.js'), 'utf8');
html = html.replace(/(src|href)="(assets\/[^"\s]+)"/g, (match, attr, path) => assets[path] ? `${attr}="${assets[path]}"` : match);
css = css.replace(/url\("(assets\/[^"\s]+)"\)/g, (match, path) => assets[path] ? `url("${assets[path]}")` : match);
html = html.replace('<link rel="stylesheet" href="workbench.css">', () => `<style>\n${css}\n</style>`);
html = html.replace('  <script src="workbench.js" defer></script>\n', '');
// Replacement callbacks preserve literal JavaScript $$, $&, and $` tokens.
html = html.replace('</body>', () => `<script>window.WORKBENCH_ASSETS=${JSON.stringify(assets)};\n${js.replaceAll('</script', '<\\/script')}\n</script>\n</body>`);
const output = resolve(root, '人生支线工作台.html');
await writeFile(output, html, 'utf8');
console.log(`已生成 ${output}，内嵌 ${Object.keys(assets).length} 个素材，${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
