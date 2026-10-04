import assert from 'node:assert/strict';
import {chromium, webkit} from 'playwright';
import {PNG} from 'pngjs';
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
          [320, 568, 0, 0, 0], [320, 568, 47, 34, 0],
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
            if (!path) {
              assert.ok(Math.abs(state.dockBottom - height) < 0.1, 'Cover and both bars include safe areas within one screen');
              // Both a single line and a wrapped subtitle must stay centred in the
              // entire visible bar, including after it scrolls away from the inset.
              for (const text of ['A quiet spectator.', 'A quiet spectator.<br>A second quiet line.']) {
                await page.locator('.letterbox-dock__line span').evaluate((e, text) => { e.innerHTML = text; }, text);
                for (const scroll of [0, 200]) {
                  await page.evaluate(y => scrollTo(0, y), scroll);
                  const alignment = await page.locator('.letterbox-dock').evaluate(e => {
                    const bar = e.getBoundingClientRect();
                    const line = e.querySelector('.letterbox-dock__line').getBoundingClientRect();
                    return {offset: (line.top + line.bottom - bar.top - bar.bottom) / 2,
                      clearance: bar.bottom - line.bottom};
                  });
                  assert.ok(Math.abs(alignment.offset) < 0.1,
                    `${engine.name()} ${width}×${height}: subtitle offset ${alignment.offset}px`);
                  assert.ok(alignment.clearance >= bottom - 0.1, 'Two lines clear the bottom safe area');
                }
              }
              await page.evaluate(() => scrollTo(0, 0));
            }
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
      // Resize the same document across breakpoints and rotate with changing
      // insets, also at 200% text size. No reload should be needed to recentre.
      const resized = await browser.newPage();
      await resized.goto(server.url);
      await resized.locator('.letterbox-dock__line span').evaluate(e => {
        e.innerHTML = 'A quiet line.<br>Another line.';
      });
      for (const fontSize of ['100%', '200%']) {
        for (const [width, height, top, bottom, side] of [
          [428, 926, 47, 34, 0], [926, 428, 0, 21, 47],
          [320, 568, 47, 34, 0], [768, 1024, 24, 20, 0],
          [1024, 768, 0, 0, 0], [390, 844, 0, 0, 0]
        ]) {
          await resized.setViewportSize({width, height});
          await resized.evaluate(({fontSize, top, bottom, side}) => {
            const style = document.documentElement.style;
            style.fontSize = fontSize;
            for (const [name, value] of Object.entries({top, bottom, left: side, right: side})) {
              style.setProperty('--lb-safe-' + name, value + 'px');
            }
            scrollTo(0, 0);
          }, {fontSize, top, bottom, side});
          const layout = await resized.locator('.letterbox-dock').evaluate(e => {
            const bar = e.getBoundingClientRect();
            const line = e.querySelector('.letterbox-dock__line').getBoundingClientRect();
            return {offset: (line.top + line.bottom - bar.top - bar.bottom) / 2,
              clearance: bar.bottom - line.bottom, bottom: bar.bottom,
              overflow: e.scrollWidth > e.clientWidth || bar.left < 0 || bar.right > innerWidth};
          });
          assert.ok(Math.abs(layout.offset) < 0.1, 'Resized subtitle stays centred');
          assert.ok(layout.clearance >= bottom - 0.1, 'Enlarged text clears the safe area');
          assert.ok(Math.abs(layout.bottom - height) < 0.1, 'Resized first screen still fits');
          assert.equal(layout.overflow, false, `${engine.name()} ${width}×${height} ${fontSize}: subtitle bar overflows`);
        }
      }
      await resized.close();
      // The dark body must not leak through touching paper surfaces at fractional DPR.
      for (const deviceScaleFactor of [1, 1.25, 1.5, 2]) for (const colorScheme of ['light', 'dark']) {
        const page = await browser.newPage({viewport: {width: 1024, height: 768}, deviceScaleFactor, colorScheme});
        await page.goto(server.url + 'reading/');
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => scrollTo(0, 100));
        const edge = await page.locator('.site-header').evaluate(e => ({
          y: e.getBoundingClientRect().bottom,
          paper: getComputedStyle(e).backgroundColor.match(/\d+/g).slice(0, 3).map(Number)
        }));
        const pixels = PNG.sync.read(await page.screenshot());
        for (let y = Math.floor(edge.y * deviceScaleFactor) - 1; y <= Math.ceil(edge.y * deviceScaleFactor) + 1; y++) {
          for (let x = 12; x < 40; x++) {
            const offset = (y * pixels.width + x) * 4;
            // Allow one 8-bit step for compositing-rounding at the overlap's outer
            // edges; the original seam and the dark-mode shadow leak exceed this.
            assert.ok([...pixels.data.subarray(offset, offset + 3)].every((value, channel) => Math.abs(value - edge.paper[channel]) <= 1),
              `${engine.name()} ${colorScheme} DPR ${deviceScaleFactor}: title seam at ${x},${y}`);
          }
        }
        await page.close();
      }
      console.log(`${engine.name()}: Home Screen metadata, safe areas, layout, menus and fractional-scale paper seams passed`);
    } finally { await browser.close(); }
  }
} finally { await server.close(); site.cleanup(); }
