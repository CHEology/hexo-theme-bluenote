import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import support from './support.cjs';
for (const design of ['classic','letterbox']) {
const site=await support.fixture({defaults:true,theme:{design}});
const server=await support.serve(site.publicDir,site.root);
try {
  for(const engine of [chromium,webkit]) {
    const browser=await engine.launch(engine===chromium&&process.env.BLUE_NOTE_CHROMIUM?{executablePath:process.env.BLUE_NOTE_CHROMIUM}:{});
    try {
      for(const width of [320,390,1280]) for(const colorScheme of ['light','dark']) {
        const page=await browser.newPage({viewport:{width,height:844},colorScheme});
        await page.goto(server.url+'reading/');
        const centred=async()=>{
          const nav=await page.locator('.post-nav').boundingBox();
          const top=await page.locator('.post-nav__top').boundingBox();
          assert.ok(Math.abs(top.x+top.width/2-nav.x-nav.width/2)<1,'Top stays centred with either one or two adjacent links');
          assert.ok(top.width>=44 && top.height>=44);
        };
        await centred();
        assert.equal(await page.locator('.post-nav__next').count(),0,'Newest post leaves the right cell empty');
        assert.equal(await page.locator('.post-nav__cell--next').innerText(),'');
        // Move from the newest entry to the middle one, which has both arrows.
        const previous=page.locator('.post-nav__prev');
        const previousUrl=await previous.evaluate(e=>e.href);
        assert.equal(previousUrl,server.url+'photo-study/');
        await previous.scrollIntoViewIfNeeded();
        await Promise.all([page.waitForURL(previousUrl),previous.click()]);
        assert.equal(await page.locator('.post-nav__prev,.post-nav__next').count(),2);
        assert.equal(await page.locator('.post-nav__next').evaluate(e=>e.href),server.url+'reading/');
        const olderUrl=await page.locator('.post-nav__prev').evaluate(e=>e.href);
        assert.equal(olderUrl,server.url+'note/');
        await page.goto(olderUrl);
        assert.equal(await page.locator('.post-nav__prev').count(),0,'Oldest post leaves the left cell empty');
        assert.equal(await page.locator('.post-nav__cell--prev').innerText(),'');
        assert.equal(await page.locator('.post-nav__next').evaluate(e=>e.href),previousUrl);
        await centred();
        await page.locator('.post-nav__next').click();
        await page.waitForURL(previousUrl);
        await centred();
        const icons=await page.locator('.post-nav .icon').evaluateAll(elements=>elements.map(e=>{
          const style=getComputedStyle(e);
          return [style.width,style.height,style.strokeWidth,style.strokeLinecap,style.strokeLinejoin,style.fill];
        }));
        assert.equal(icons.length,3);
        assert.deepEqual(icons[0],icons[2],'Side arrows keep matching strokes');
        assert.equal(icons[1][2],'1.5px','Diamond has a lighter stroke');
        assert.equal(icons[1][5],'none','Diamond stays hollow');
        for(const link of await page.locator('.post-nav__prev,.post-nav__next').all()) {
          await link.scrollIntoViewIfNeeded();
          const before=await link.evaluate(e=>getComputedStyle(e).color);
          const box=await link.boundingBox();
          await link.hover();
          await page.waitForTimeout(250);
          assert.notEqual(await link.evaluate(e=>getComputedStyle(e).color),before,'Hover changes colour');
          assert.equal(await link.locator('.icon').evaluate(e=>getComputedStyle(e).animationName),'none');
          assert.equal(await link.locator('.icon').evaluate(e=>getComputedStyle(e).transform),'none');
          const text=link.locator(width<=575?'.post-nav__label':'.post-nav__title');
          assert.equal(await text.evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');
          assert.deepEqual(await link.boundingBox(),box,'Hover does not shift the link');
          await page.mouse.move(0,0);
          await page.keyboard.press('Tab');
          await link.focus();
          assert.equal(await link.evaluate(e=>e.matches(':focus-visible')),true);
          assert.equal(await text.evaluate(e=>getComputedStyle(e).textDecorationLine),'underline');
          await link.evaluate(e=>e.blur());
          await page.waitForTimeout(220);
        }
        const top=page.getByRole('link',{name:'Back to top',exact:true});
        await top.hover();
        assert.equal(await top.evaluate(e=>getComputedStyle(e,'::after').opacity),'1','Icon-only Top has the matching underline');
        const before=await top.boundingBox();
        await page.mouse.move(0,0);
        await page.keyboard.press('Tab');
        await top.focus();
        assert.equal(await top.evaluate(e=>e.matches(':focus-visible')),true);
        assert.equal(await top.evaluate(e=>getComputedStyle(e,'::after').opacity),'1');
        assert.deepEqual(await top.boundingBox(),before);
        // Nonzero safe areas previously hid even more of the Letterbox bar.
        if(design==='letterbox') await page.addStyleTag({content:'html{--lb-safe-top:47px}'});
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>scrollY===0);
        assert.equal((await page.locator('.site-nav').boundingBox()).y,0,'Entire bar is visible');
        await top.click();
        await page.waitForFunction(()=>scrollY===0);
        assert.equal(await page.evaluate(()=>document.activeElement.id),'page-top');
        await page.reload();
        await page.waitForFunction(()=>scrollY===0);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        await page.close();
      }
      const noScript=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
      await noScript.goto(server.url+'reading/');
      await noScript.getByRole('link',{name:'Back to top',exact:true}).click();
      assert.equal(await noScript.evaluate(()=>scrollY),0,'Top works without JavaScript');
      assert.equal(await noScript.evaluate(()=>document.activeElement.id),'page-top');
      await noScript.close();
      console.log(design+' '+engine.name()+': adjacent-post colour/underline, stationary arrows and keyboard focus passed at three widths and two schemes');
    } finally {await browser.close()}
  }
} finally {await server.close();site.cleanup()}

}
