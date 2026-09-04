import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import support from './support.cjs';
const {fixture,serve}=support;
const active=await fixture({root:'/notes/',defaults:true});
const disabled=await fixture({theme:{search:{enable:false},post:{lightbox:false}}});
const gallery=await fixture({root:'/journal/',theme:{gallery:{path:'photographs'}}});
const fixedScheme=await fixture({theme:{dark_mode:{default:'light'}}});
const fixtures=[active,disabled,gallery,fixedScheme];
const servers=await Promise.all(fixtures.map(f=>serve(f.publicDir,f.root)));
try {
  for(const engine of [chromium,webkit]) {
    const browser=await engine.launch();
    try {
      const context=await browser.newContext({viewport:{width:1280,height:900}});
      const page=await context.newPage();const errors=[];const requests=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
      page.on('requestfailed',r=>{if(!/aborted|cancelled|canceled/i.test(r.failure()?.errorText||''))errors.push(r.failure()?.errorText+' '+r.url());});
      page.on('request',r=>requests.push(r.url()));
      await page.goto(servers[0].url+'reading/');
      assert.ok(await page.locator('.markdown-body p').first().evaluate(e=>e.getBoundingClientRect().width<680));
      for(const caption of await page.locator('figcaption.image-caption').all()) assert.ok(await caption.isVisible());
      assert.ok(await page.locator('.post-toc').isVisible());
      await page.getByRole('button',{name:'A blue rectangle within a warm field.',exact:true}).press('Enter');
      assert.ok(await page.locator('dialog.lightbox').isVisible());
      await page.keyboard.press('Escape');
      await page.getByRole('link',{name:'Search',exact:true}).click();
      const input=page.getByRole('searchbox');
      await input.fill('no-such-post-582');
      await page.getByText('No matching posts.',{exact:true}).waitFor();
      await input.press('Shift+Tab');
      assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-search-close')),true);
      await page.keyboard.press('Tab');
      assert.equal(await input.evaluate(e=>e===document.activeElement),true);
      assert.equal(await page.locator('header').evaluate(e=>e.inert),true);
      await input.fill('Reading');
      await page.locator('.site-search-result').first().waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('header').evaluate(e=>e.inert),false);
      assert.ok(requests.every(url=>!url.includes('/private/')));
      // Failure can be retried without a reload.
      const retryPage=await context.newPage();let attempts=0;
      await retryPage.route('**/search.xml',route=>++attempts===1?route.fulfill({status:503,body:'unavailable'}):route.continue());
      await retryPage.goto(servers[0].url);
      await retryPage.getByRole('link',{name:'Search',exact:true}).click();
      await retryPage.getByText('Search could not load.').waitFor();
      await retryPage.getByRole('button',{name:'Try again',exact:true}).click();
      await retryPage.getByRole('searchbox').fill('Reading');
      await retryPage.locator('.site-search-result').first().waitFor();
      assert.equal(attempts,2);
      await retryPage.close();
      await page.goto(servers[1].url+'reading/');
      assert.equal(await page.locator('a[href="#site-search"]').count(),0);
      assert.equal(await page.locator('dialog.lightbox').count(),0);
      assert.equal(await page.locator('.markdown-body img').first().getAttribute('role'),null);
      const imageRequests=[];
      page.on('request',r=>{if(/study-\d+.*png/.test(r.url()))imageRequests.push(r.url());});
      await page.goto(servers[2].url+'photographs/');
      await page.locator('[data-gallery-open]').first().waitFor();
      const before=await page.locator('[data-gallery-open]').evaluateAll(a=>a.map(e=>e.dataset.galleryOpen));
      assert.ok(before.length>=3&&before.length<=5);
      assert.ok(imageRequests.every(url=>/-[36]00\.png/.test(url)));
      await page.getByRole('button',{name:'Reshuffle',exact:true}).first().click();
      const after=await page.locator('[data-gallery-open]').evaluateAll(a=>a.map(e=>e.dataset.galleryOpen));
      assert.ok(after.length>=3&&after.length<=5);
      await page.locator('[data-gallery-open]').first().click();
      await page.locator('[data-gallery-viewer][open]').waitFor();
      await page.getByRole('button',{name:'Next image',exact:true}).click();
      assert.match(await page.locator('[data-gallery-count]').innerText(),/^2 \/ /);
      await page.keyboard.press('Escape');
      for(const width of [320,390,768,1024,1440]) {
        await page.setViewportSize({width,height:844});
        for(const path of ['', 'reading/', 'archives/']) {
          await page.goto(servers[0].url+path);
          assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),engine.name()+' overflow '+width+' '+path);
        }
      }
      await page.setViewportSize({width:390,height:844});
      await page.goto(servers[0].url);
      assert.equal(await page.getByRole('link',{name:'Search',exact:true}).isVisible(),false);
      await page.getByRole('button',{name:'Toggle navigation',exact:true}).click();
      await page.getByRole('link',{name:'Search',exact:true}).click();
      await page.getByRole('searchbox').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.site-nav__toggle').evaluate(e=>e===document.activeElement),true);
      await page.setViewportSize({width:1280,height:900});
      await page.emulateMedia({colorScheme:'dark'});
      await page.goto(servers[3].url+'reading/');
      assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(238, 233, 223)');
      await page.locator('.scheme-toggle').click();
      assert.equal(await page.locator('html').getAttribute('data-scheme'),'dark');
      await page.locator('.scheme-toggle').click();
      assert.equal(await page.locator('html').getAttribute('data-scheme'),'light');
      assert.deepEqual(errors,[]);
      await context.close();
      console.log(engine.name()+': configuration, captions, search/retry/focus, Gallery and five viewport widths passed');
    } finally {await browser.close();}
  }
} finally {await Promise.all(servers.map(s=>s.close()));for(const f of fixtures)f.cleanup();}
