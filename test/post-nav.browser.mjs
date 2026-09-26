import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import support from './support.cjs';
const site=await support.fixture({defaults:true});
const server=await support.serve(site.publicDir,site.root);
try {
  for(const engine of [chromium,webkit]) {
    const browser=await engine.launch();
    try {
      for(const width of [320,390,1280]) for(const colorScheme of ['light','dark']) {
        const page=await browser.newPage({viewport:{width,height:844},colorScheme});
        await page.goto(server.url+'reading/');
        // Move from the newest entry to the middle one, which has both arrows.
        const next=page.locator('.post-nav__next');
        const nextUrl=await next.evaluate(e=>e.href);
        await Promise.all([page.waitForURL(nextUrl),next.click()]);
        assert.equal(await page.locator('.post-nav__prev,.post-nav__next').count(),2);
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
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        await page.close();
      }
      console.log(engine.name()+': adjacent-post colour/underline, stationary arrows and keyboard focus passed at three widths and two schemes');
    } finally {await browser.close()}
  }
} finally {await server.close();site.cleanup()}
