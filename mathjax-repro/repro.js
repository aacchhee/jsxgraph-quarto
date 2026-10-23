// Builds a sandboxed iframe from a data: URL (an opaque origin) that loads
// MathJax 4 and typesets one formula, then reports whether SVG appeared.
// Query options: ?speech=off disables speech/braille; ?mjx=<url> overrides
// the MathJax URL (default: jsDelivr 4.1.3).
const params = new URLSearchParams(location.search);
const mjx = params.get('mjx') || 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-mml-svg.js';
const speechOff = params.get('speech') === 'off';
const config = speechOff
  ? '<script>window.MathJax={options:{enableSpeech:false,enableBraille:false,menuOptions:{settings:{speech:false,braille:false}}}};<\/script>'
  : '';
const frameHTML = `<!DOCTYPE html><html><head><meta charset="utf-8">${config}
<script id="MathJax-script" async src="${mjx}"><\/script>
<script>
  addEventListener('error', e => parent.postMessage({kind: 'error', message: String(e.message)}, '*'));
  addEventListener('unhandledrejection', e => parent.postMessage({kind: 'error', message: 'unhandled rejection: ' + String(e.reason)}, '*'));
  const started = performance.now();
  (function poll() {
    const svg = document.querySelector('mjx-container svg');
    if (svg) {
      const ms = Math.round(performance.now() - started);
      // Speech is attached after typesetting; report it if it arrives within 5 s.
      const until = performance.now() + 5000;
      (function speech() {
        const node = document.querySelector('[data-semantic-speech-none], [data-semantic-speech]');
        const text = node && (node.getAttribute('data-semantic-speech-none') || node.getAttribute('data-semantic-speech'));
        if (text || performance.now() > until) later(ms, text || null);
        else setTimeout(speech, 100);
      })();
    }
    else if (performance.now() - started > 15000) parent.postMessage({kind: 'timeout', origin: self.origin,
      mathjax: typeof MathJax === 'object' ? MathJax.version : null}, '*');
    else setTimeout(poll, 100);
  })();
  // After the first SVG: does MathJax's startup promise settle, and can a
  // formula added later still be typeset? Each is given 10 s.
  function within(promise) {
    return Promise.race([promise.then(() => 'resolved', e => 'rejected: ' + String(e)),
      new Promise(r => setTimeout(() => r('pending after 10 s'), 10000))]);
  }
  async function later(ms, speech) {
    const startup = await within(MathJax.startup.promise);
    const p = document.createElement('p'); p.textContent = '\\\\(y^3\\\\)'; document.body.append(p);
    const typeset = await within(MathJax.typesetPromise([p]));
    const laterSvg = !!p.querySelector('mjx-container svg');
    parent.postMessage({kind: 'svg', ms, origin: self.origin, speech, startup, typeset, laterSvg}, '*');
  }
<\/script></head><body><p>\\(x^2+1\\)</p></body></html>`;
const result = document.getElementById('result');
result.textContent = `Waiting… (crossOriginIsolated=${self.crossOriginIsolated}, speech ${speechOff ? 'off' : 'on'})`;
addEventListener('message', ({data}) => {
  if (data.kind === 'error') { document.getElementById('errors').textContent += data.message + '\n'; return; }
  window.__result = {...data, crossOriginIsolated: self.crossOriginIsolated, speechOff};
  result.textContent = JSON.stringify(window.__result);
});
const frame = document.createElement('iframe');
frame.setAttribute('sandbox', 'allow-scripts');
frame.src = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(frameHTML)));
document.body.append(frame);
