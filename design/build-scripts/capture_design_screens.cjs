const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const assert = require('assert/strict');
const deps = 'C:/Users/sm757/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(path.join(deps, 'playwright'));
const sharp = require(path.join(deps, 'sharp'));

(async () => {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, '새록_앱데모_2차.html');
  const out = path.join(root, '새록_2차_디자인_산출물');
  const screenDir = path.join(out, 'screens');
  const assetDir = path.join(out, 'assets');
  fs.mkdirSync(screenDir, { recursive: true });
  fs.mkdirSync(assetDir, { recursive: true });
  const hash = () => crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
  const before = hash();
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const context = await browser.newContext({ viewport: { width: 414, height: 920 }, deviceScaleFactor: 2, colorScheme: 'light' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(source).href);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: `
      html,body{width:414px!important;height:920px!important;overflow:hidden!important;background:transparent!important}
      .app{display:block!important;width:414px!important;height:920px!important;min-height:0!important}
      .side,.bar,.hint{display:none!important}
      .stage,.canvas{display:block!important;position:relative!important;width:414px!important;height:920px!important;padding:0!important;overflow:hidden!important}
      .phone-wrap{position:relative!important;width:414px!important;height:920px!important}
      .phone{transform:none!important;left:0!important;top:0!important}
      *,*:before,*:after{animation:none!important;transition:none!important}
    ` });
    const meta = await page.evaluate(() => META);
    assert.equal(meta.list.length, 32);
    assert.equal(await page.locator('.scr').count(), 32);
    await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
    const manifest = [];
    for (const id of meta.order) {
      const info = meta.list.find(s => s.id === id);
      await page.selectOption('#pick', id, { force: true });
      const filename = `${String(info.num).padStart(2, '0')}_${info.label.replace(/[\\/:*?"<>|· ]+/g, '_')}.png`;
      const target = path.join(screenDir, filename);
      await page.locator('.scr.on .screen').screenshot({ path: target, animations: 'disabled', omitBackground: true });
      const imageInfo = await sharp(target).metadata();
      assert.deepEqual([imageInfo.width, imageInfo.height], [828, 1840]);
      manifest.push({ ...info, path: target, width: 828, height: 1840 });
    }
    const mascot = await page.evaluate(() => A['9c9e029db4']);
    const svg = Buffer.from(mascot.split(',')[1], 'base64');
    await sharp(svg).resize(720, 720).png().toFile(path.join(assetDir, '몽글.png'));
    fs.writeFileSync(path.join(out, 'screen_manifest.json'), JSON.stringify(manifest, null, 2));
    assert.equal(hash(), before, 'Source was modified');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'source_version.json'), JSON.stringify({ source, sha256: before, screens: 32, capturedAt: '2026-11-02', originalUnchanged: true }, null, 2));
    console.log(JSON.stringify({ screens: manifest.length, dimensions: [828,1840], errors, originalUnchanged: true, manifest: path.join(out, 'screen_manifest.json'), mascot: path.join(assetDir, '몽글.png') }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
