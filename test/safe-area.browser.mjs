import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';
import support from './support.cjs';

// Desktop engines cannot draw the iOS system status bar. Inject nonzero inset
// tokens to verify layout arithmetic; real Home Screen rendering remains a device check.
const site = await support.fixture({defaults: true, theme: {design: 'letterbox'}});
const server = await support.serve(site.publicDir, site.root);
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const colorScheme of ['light', 'dark']) {
        for (const [width, height, top, bottom, side] of [
          [390, 844, 0, 0, 0], [428, 926, 47, 34, 0],
          [768, 1024, 24, 20, 0], [926, 428, 0, 21, 47]
        ]) {
          const page = await browser.newPage({viewport: {width, height}, colorScheme});
          for (const path of ['', 'reading/']) {
            await page.goto(server.url + path);
            assert.match(await page.locator('meta[name="viewport"]').getAttribute('content'), /viewport-fit=cover/);
            assert.equal(await page.locator('meta[name="apple-mobile-web-app-status-bar-style"]').getAttribute('content'), 'black-translucent');
            await page.addStyleTag({content: `html[data-design="letterbox"]{--lb-safe-top:${top}px;--lb-safe-bottom:${bottom}px;--lb-safe-left:${side}px;--lb-safe-right:${side}px}`});
            const state = await page.evaluate(() => {
              const root = getComputedStyle(document.documentElement);
              const nav = document.querySelector('.site-nav').getBoundingClientRect();
              const brand = document.querySelector('.site-nav__brand').getBoundingClientRect();
              const dock = document.querySelector('.letterbox-dock')?.getBoundingClientRect();
              return {
                bar: root.getPropertyValue('--lb-bar-h').trim(),
                body: getComputedStyle(document.body).backgroundColor,
                nav: getComputedStyle(document.querySelector('.site-nav')).backgroundColor,
                paper: root.getPropertyValue('--paper').trim(),
                surface: getComputedStyle(document.querySelector('.page-body') || document.querySelector('.letterbox-index')).backgroundColor,
                topHeight: nav.height, brandTop: brand.top, brandLeft: brand.left,
                bandHeight: getComputedStyle(document.body, '::before').height,
                dockBottom: dock?.bottom, overflow: document.documentElement.scrollWidth > innerWidth
              };
            });
            assert.equal(state.body, state.nav, 'iOS body colour source matches the bar');
            assert.equal(state.topHeight, parseFloat(state.bar) + top);
            assert.equal(state.bandHeight, top + 'px');
            assert.ok(state.brandTop >= top && state.brandLeft >= side);
            assert.equal(state.overflow, false);
            if (!path) assert.ok(Math.abs(state.dockBottom - height) < 0.1, 'Cover and both bars include safe areas within one screen');
            if (path) {
              assert.equal(await page.locator('.page-body').evaluate((e, paper) => {
                const probe = document.createElement('span'); probe.style.color = paper; e.append(probe);
                const matches = getComputedStyle(e).backgroundColor === getComputedStyle(probe).color;
                probe.remove(); return matches;
              }, state.paper), true, 'Article retains the selected paper colour');
            }
            await page.evaluate(() => scrollTo(0, 300));
            assert.ok(await page.locator('.site-nav').evaluate(e => e.getBoundingClientRect().bottom <= 0), 'Navigation still scrolls away');
            if (width < 768) {
              await page.evaluate(() => scrollTo(0, 0));
              await page.locator('.site-nav__toggle').click();
              assert.equal(await page.locator('.site-nav').evaluate(e => e.getBoundingClientRect().top), 0);
              assert.ok(await page.locator('.site-menu__item').first().evaluate((e, t) => e.getBoundingClientRect().top >= t, top));
              await page.keyboard.press('Escape');
              assert.equal(await page.evaluate(() => scrollY), 0);
            }
          }
          await page.close();
        }
      }
      console.log(`${engine.name()}: Home Screen metadata, dark body, zero/nonzero safe areas, first-screen height, reading surface and menu passed`);
    } finally { await browser.close(); }
  }
} finally { await server.close(); site.cleanup(); }
