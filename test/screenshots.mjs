import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import support from './support.cjs';
const {fixture,serve,themeRoot}=support;
const f=await fixture(),server=await serve(f.publicDir);
const out=join(themeRoot,'docs/screenshots');mkdirSync(out,{recursive:true});
const browser=await chromium.launch();
try {
  for(const shot of [
    {name:'home-desktop',path:'',width:1280,height:800},
    {name:'article-desktop',path:'reading/',width:1280,height:900},
    {name:'article-mobile',path:'reading/',width:390,height:844},
    {name:'article-dark',path:'reading/',width:1280,height:900,scheme:'dark'},
    {name:'gallery-desktop',path:'gallery/',width:1280,height:900},
    {name:'gallery-mobile',path:'gallery/',width:390,height:844}
  ]) {
    const context=await browser.newContext({viewport:{width:shot.width,height:shot.height},colorScheme:shot.scheme||'light',deviceScaleFactor:1});
    await context.addInitScript(()=>{let seed=42;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(server.url+shot.path,{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:join(out,shot.name+'.png'),animations:'disabled'});
    if(errors.length)throw new Error(errors.join('\n'));
    await context.close();console.log(shot.name);
  }
}finally{await browser.close();await server.close();f.cleanup();}
