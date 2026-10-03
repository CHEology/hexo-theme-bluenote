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
    const browser=await engine.launch(engine===chromium&&process.env.BLUE_NOTE_CHROMIUM?{executablePath:process.env.BLUE_NOTE_CHROMIUM}:{});
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
          if(path==='' && width<=767) {
            const list=await page.locator('.index-card').first().evaluate(card=>{
              const title=card.querySelector('.index-header');
              return {ratio:getComputedStyle(card).aspectRatio,shadow:getComputedStyle(card).boxShadow,
                height:card.getBoundingClientRect().height,width:card.getBoundingClientRect().width,
                fullTitle:title.scrollHeight<=title.clientHeight,
                excerptLines:getComputedStyle(card.querySelector('.index-excerpt > div')).webkitLineClamp};
            });
            assert.equal(list.ratio,'auto');
            assert.equal(list.shadow,'none');
            assert.ok(list.height<list.width,'Mobile rows fit content instead of retaining square cards');
            assert.ok(list.fullTitle,'Mobile titles are not clamped');
            assert.equal(list.excerptLines,'2');
          }
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
      // Hold the first index response. Empty searches must have identical
      // geometry before/after loading, even after closing and reopening early.
      for(const width of [320,390,1280]) for(const colorScheme of ['light','dark']) {
        const stableContext=await browser.newContext({viewport:{width,height:844},colorScheme});
        const stable=await stableContext.newPage();
        let release;const gate=new Promise(resolve=>{release=resolve});let requests=0;
        await stable.route('**/search.xml',async route=>{requests++;await gate;await route.continue()});
        try {
          await stable.goto(servers[0].url);
          const open=async()=>{
            if(width<992)await stable.locator('.site-nav__toggle').click();
            await stable.getByRole('link',{name:'Search',exact:true}).click();
          };
          const box=()=>stable.locator('.site-search-dialog').boundingBox();
          await stable.evaluate(()=>{
            const selectors=['.site-search-dialog','.site-search-dialog__field','#site-search-input'];
            const measure=()=>selectors.map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [r.x,r.y,r.width,r.height]});
            const check=window.searchLayout={running:true,baseline:null,maxMovement:0,samples:0};
            const sample=()=>{if(!check.running)return;if(!document.querySelector('[data-search-overlay]').hidden){const boxes=measure();check.baseline||=boxes;boxes.forEach((b,i)=>b.forEach((n,j)=>{check.maxMovement=Math.max(check.maxMovement,Math.abs(n-check.baseline[i][j]))}));check.samples++;}requestAnimationFrame(sample)};
            requestAnimationFrame(sample);
          });
          await open();
          const first=await box();
          assert.equal(await stable.locator('.site-search-results').isVisible(),false,'No temporary row on first open');
          assert.equal(await stable.getByRole('searchbox').getAttribute('aria-busy'),'true');
          await stable.waitForFunction(()=>window.searchLayout.samples>=4);
          await stable.keyboard.press('Escape');
          await open();
          assert.deepEqual(await box(),first,'Reopening a pending empty search is stable');
          release();
          await stable.waitForFunction(()=>document.querySelector('#site-search-input').getAttribute('aria-busy')==='false');
          await stable.waitForFunction(()=>window.searchLayout.samples>=8);
          assert.deepEqual(await box(),first,'Index completion does not resize the panel');
          await stable.keyboard.press('Escape');
          await open();
          assert.deepEqual(await box(),first,'Cached opening matches cold opening');
          const measured=await stable.evaluate(()=>{window.searchLayout.running=false;return window.searchLayout});
          assert.equal(measured.maxMovement,0,engine.name()+' '+width+' '+colorScheme+' search movement');
          assert.equal(requests,1,'Reopening shares the pending or cached index');
          await stable.getByRole('searchbox').fill('Reading');
          await stable.locator('.site-search-result').first().waitFor();
          await stable.getByRole('searchbox').fill('');
          assert.deepEqual(await box(),first,'Clearing a query restores the same input-only panel');
        } finally {release();await stableContext.close()}
      }
      // Typing before the index arrives still reports loading and preserves the query.
      const pending=await browser.newPage();
      let releaseQuery;const queryGate=new Promise(resolve=>{releaseQuery=resolve});
      await pending.route('**/search.xml',async route=>{await queryGate;await route.continue()});
      try {
        await pending.goto(servers[0].url+'reading/');
        await pending.getByRole('link',{name:'Search',exact:true}).click();
        await pending.getByRole('searchbox').fill('Reading');
        await pending.getByText('Loading…',{exact:true}).waitFor();
        releaseQuery();
        await pending.locator('.site-search-result').first().waitFor();
        assert.equal(await pending.getByRole('searchbox').inputValue(),'Reading');
      } finally {releaseQuery();await pending.close()}
      console.log(engine.name()+': configuration, captions, search/retry/focus, Gallery and five viewport widths passed');
    } finally {await browser.close();}
  }
} finally {await Promise.all(servers.map(s=>s.close()));for(const f of fixtures)f.cleanup();}
