import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';
import support from './support.cjs';

const site = await support.fixture({root: '/notes/', defaults: true, theme: {design: 'letterbox'}});
const server = await support.serve(site.publicDir, site.root);
try {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch();
    try {
      for (const colorScheme of ['light', 'dark']) {
        for (const [width, height, top, bottom, side] of [
          [1280, 900, 0, 0, 0], [390, 844, 0, 0, 0],
          [320, 568, 47, 34, 0], [768, 1024, 24, 20, 0], [844, 390, 0, 21, 47]
        ]) {
          const page = await browser.newPage({viewport: {width, height}, colorScheme});
          await page.goto(server.url + '404.html');
          await page.evaluate(() => document.fonts.ready);
          await page.addStyleTag({content: `html[data-design="letterbox"]{--lb-safe-top:${top}px;--lb-safe-bottom:${bottom}px;--lb-safe-left:${side}px;--lb-safe-right:${side}px}`});
          const state = await page.evaluate(() => {
            const box = selector => document.querySelector(selector).getBoundingClientRect();
            const nav = box('.site-nav'), cover = box('.error-cover');
            const title = box('.error-cover__title'), link = box('.error-cover__link');
            return {
              gap: cover.top - nav.bottom, bottom: cover.bottom, left: cover.left,
              right: cover.right, width: document.documentElement.clientWidth,
              scrollHeight: document.documentElement.scrollHeight,
              scrollWidth: document.documentElement.scrollWidth,
              centreError: (title.top + link.bottom) / 2 - (cover.top + cover.bottom) / 2,
              titleLeft: title.left, titleRight: title.right
            };
          });
          const label = `${engine.name()} ${colorScheme} ${width}×${height}`;
          assert.equal(state.gap, 0, label + ': paper gap below navigation');
          assert.ok(Math.abs(state.bottom - height) < 1, label + ': cover does not fit viewport');
          assert.equal(state.scrollHeight, height, label + ': unnecessary scrolling');
          assert.equal(state.left, 0, label + ': left paper strip');
          assert.equal(state.right, state.width, label + ': right paper strip');
          assert.equal(state.scrollWidth, state.width, label + ': horizontal overflow');
          assert.ok(Math.abs(state.centreError) < 1, label + ': content is not centred');
          assert.ok(state.titleLeft >= side && state.titleRight <= state.width - side, label + ': unsafe text');
          await page.locator('.error-cover__link').click();
          assert.equal(page.url(), server.url, label + ': wrong home link');
          await page.close();
        }
      }
      // Large type in a short window may scroll, but must stay readable without JS.
      const page = await browser.newPage({viewport: {width: 320, height: 300}, javaScriptEnabled: false});
      await page.goto(server.url + '404.html');
      await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
      const readable = await page.evaluate(() => {
        const cover = document.querySelector('.error-cover').getBoundingClientRect();
        const link = document.querySelector('.error-cover__link').getBoundingClientRect();
        return link.bottom <= cover.bottom && document.documentElement.scrollWidth <= innerWidth;
      });
      assert.ok(readable, engine.name() + ': enlarged text is clipped');
      await page.locator('.error-cover__link').click();
      assert.equal(page.url(), server.url);
      await page.close();
    } finally { await browser.close(); }
  }
  console.log('404 layout: Chromium and WebKit, both schemes, safe areas and enlarged text passed.');
} finally {
  await server.close();
  site.cleanup();
}
