// The generated iframe runs the board code inline, defines BOARDID for the
// whole code, and leaves resizing to JSXGraph's own resize observer, with two
// additions: a board created while hidden gets its intended view when first
// shown, and boards re-read their size after the iframe's resize event.
// Browser behaviour is tested in ctm-assessment
// (integration/feedback/jsxgraph-layout.cjs).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const lua = await readFile(new URL('../_extensions/jsxgraph/lua/jsxgraph.lua', import.meta.url), 'utf8');

test('BOARDID is defined for the whole board code', () => {
  assert.match(lua, /local prelude = 'window\.BOARDID = "' \.\. id \.\. '";\\n'/);
  assert.match(lua, /use strict/, "the prelude goes after a leading 'use strict'");
});

test('board code runs while the page is parsed', () => {
  assert.match(lua, /<script>%s<\/script>\n<\/body>/, 'board code is the last inline script, as upstream');
  assert.match(lua, /window\.addEventListener\('load', resolve, \{once: true\}\)/, 'a request waits for load handlers');
});

test("JSXGraph's resize observer does the resizing; no fixed pixel size", () => {
  assert.doesNotMatch(lua, /resize\.enabled = false/, "JSXGraph's observer stays on");
  assert.doesNotMatch(lua, /resizeContainer\(width, height\)/, 'no pixel size on the container');
  assert.match(lua, /window\.addEventListener\('resize', refreshBoards\)/);
  assert.match(lua, /board\.updateContainerDims\(\);/, 'size re-read from the container');
});

test('a board created while hidden gets its view when first shown', () => {
  assert.match(lua, /JXG\.JSXGraph\.initBoard = function/);
  assert.match(lua, /!\(board\.canvasWidth > 0 && board\.canvasHeight > 0\) && board\.origin\) startWhenShown\(board\)/);
});

test('the default JSXGraph is the 1.x line', () => {
  assert.match(lua, /src_jxg = 'https:\/\/cdn\.jsdelivr\.net\/npm\/jsxgraph@1\/distrib\/jsxgraphcore\.js'/);
});
