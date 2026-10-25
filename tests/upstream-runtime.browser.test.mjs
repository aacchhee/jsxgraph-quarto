import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadPlaywright} from './support/browser.mjs';
const root=new URL('../_extensions/jsxgraph/',import.meta.url);
const receipt=JSON.parse(readFileSync(new URL('upstream-runtime.json',root)));
test('bundled upstream development artifacts match their provenance',()=>{
 for(const [name,sha] of Object.entries(receipt.files))assert.equal(createHash('sha256').update(readFileSync(new URL(name,root))).digest('hex'),sha);
});
const playwright=await loadPlaywright();
for(const name of (process.env.JXG_TEST_BROWSERS || 'chromium').split(',')) {
 test('upstream hidden view and explicit units recover in '+name,{skip:!playwright && 'Playwright unavailable'},async()=>{
  const browser=await playwright[name].launch({headless:true,...(name==='chromium' && process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{
   const page=await browser.newPage();
   await page.setContent('<div id="visible" style="width:400px;height:200px"></div><div id="holder" style="display:none;width:400px"><div id="hidden" style="width:100%;height:200px"></div><div id="units" style="width:100%;height:200px"></div></div>');
   await page.addScriptTag({path:fileURLToPath(new URL('resources/js/jsxgraphcore.js',root))});
   const expected=await page.evaluate(()=>{
    const options={boundingbox:[-5,5,5,-5],axis:false,keepaspectratio:false,showCopyright:false,showNavigation:false};
    window.control=JXG.JSXGraph.initBoard('visible',options);control.setBoundingBox([0,10,10,0],false);
    window.hiddenBoard=JXG.JSXGraph.initBoard('hidden',options);hiddenBoard.setBoundingBox([0,10,10,0],false);
    window.unitsBoard=JXG.JSXGraph.initBoard('units',{originX:50,originY:250,unitX:40,unitY:20,axis:false,showCopyright:false,showNavigation:false});
    return {version:JXG.version,bbox:control.getBoundingBox()};
   });
   assert.equal(expected.version,receipt.runtimeVersion);
   await page.evaluate(()=>{document.querySelector('#holder').style.display='';});
   await page.waitForFunction(()=>hiddenBoard.canvasWidth>0 && unitsBoard.canvasWidth>0);
   const actual=await page.evaluate(()=>({bbox:hiddenBoard.getBoundingBox(),units:[unitsBoard.unitX,unitsBoard.unitY],origin:unitsBoard.origin.scrCoords.slice(1)}));
   assert.deepEqual(actual.bbox,expected.bbox);assert.deepEqual(actual.units,[40,20]);assert.deepEqual(actual.origin,[50,250]);
  }finally{await browser.close();}
 });
}
