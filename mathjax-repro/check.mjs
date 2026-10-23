import {createRequire} from 'node:module';
const require = createRequire(process.env.PW_ROOT + '/');
const pw = require('playwright');
const base = process.argv[2], mjx = process.argv[3] || '';
const out = [];
for (const name of (process.env.BROWSERS || 'chromium').split(',')) {
  const browser = await pw[name].launch();
  for (const page of ['isolated', 'plain']) for (const speech of ['on', 'off']) {
    const p = await browser.newPage();
    const errors = [];
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto(`${base}/${page}.html?speech=${speech}${mjx ? '&mjx=' + encodeURIComponent(mjx) : ''}`);
    await p.waitForFunction(() => window.__result, null, {timeout: 25000}).catch(() => {});
    const result = await p.evaluate(() => window.__result || null);
    out.push({browser: name, version: browser.version(), page, speech, result, errors: errors.slice(0, 3)});
    await p.close();
  }
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
