// The generated iframe defers the board code until the iframe has a size,
// defines BOARDID for the whole code, and resizes without fixing the
// container's pixel size. Browser behaviour is tested in ctm-assessment
// (integration/feedback/jsxgraph-layout.cjs: nested tabs, collapsed callout,
// mobile width, user view, hidden assessment request).
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const lua = await readFile(new URL('../_extensions/jsxgraph/lua/jsxgraph.lua', import.meta.url), 'utf8');

test('BOARDID is defined for the whole board code', () => {
  assert.match(lua, /jsxgraph = 'var BOARDID = "' \.\. id \.\. '";\\n' \.\. jsxgraph/);
});

test('board code is inert until the iframe has a size', () => {
  assert.match(lua, /<script type="text\/plain" id="jsxgraph-board-code">%s<\/script>/);
  assert.match(lua, /window\.innerWidth > 0 && window\.innerHeight > 0/);
  assert.match(lua, /window\.JXGQuartoStart\(true\)/, 'an assessment request starts a hidden board');
});

test('resizing keeps the container fluid and restores the intended view', () => {
  assert.match(lua, /board\.resizeContainer\(width, height, true, true\)/);
  assert.doesNotMatch(lua, /board\.resizeContainer\(width, height\);/);
  assert.match(lua, /board\.setBoundingBox\(fit\(view\.intended, board, width, height\), board\.keepaspectratio\)/);
  assert.match(lua, /const width = container\.clientWidth, height = container\.clientHeight;/, "sized from the container");
  assert.match(lua, /JXG\.JSXGraph\.initBoard = function/, 'views are recorded when boards are created');
  assert.match(lua, /JXG\.Options\.board\.resize\.enabled = false/, 'one resizer: the extension');
});
