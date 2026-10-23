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
    const logs = [];
    p.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 160)));
    p.on('requestfailed', r => logs.push('requestfailed: ' + r.url().slice(0, 100) + ' ' + (r.failure() || {}).errorText));
    await p.waitForFunction(() => window.__result, null, {timeout: 60000}).catch(() => {});
    const result = await p.evaluate(() => window.__result || null);
    let frameState = null;
    if (!result) {
      const frame = p.frames()[1];
      frameState = frame ? await frame.evaluate(() => ({ready: document.readyState, mathjax: typeof MathJax,
        version: typeof MathJax === 'object' ? MathJax.version : null, svg: !!document.querySelector('mjx-container svg')})).catch(e => String(e)) : 'no frame';
      frameState = {frameState, parentText: await p.evaluate(() => document.body.innerText.slice(0, 300))};
    }
    out.push({browser: name, version: browser.version(), page, speech, result, frameState, errors: errors.slice(0, 3), logs: logs.slice(0, 8)});
    await p.close();
  }
  await browser.close();
}
console.log(JSON.stringify(out, null, 1));
