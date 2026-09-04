/* Optional Gallery: content belongs to the site; the module owns rendering. */
'use strict';
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const { validateGallery, renderGallery } = require('../modules/gallery/lib/gallery.cjs');
const translations = require('../modules/gallery/labels.json');

hexo.extend.generator.register('bluenote-gallery', function() {
  const settings = this.theme.config.gallery || {};
  if (!settings.enable) return [];
  const path = String(settings.path || 'gallery').replace(/^\/+|\/+$/g, '');
  const data = String(settings.data || 'gallery');
  if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/i.test(path) || !/^[a-z0-9_-]+$/i.test(data)) {
    throw new Error('Gallery path and data must be local URL-safe names.');
  }
  const file = join(this.source_dir, '_data', data + '.json');
  const manifest = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { version: 1, photos: [] };
  const photos = validateGallery(manifest, this.source_dir);
  const locale = settings.language || (Array.isArray(this.config.language) ? this.config.language[0] : this.config.language);
  const labels = { ...translations.en, ...(translations[locale] || {}), ...(settings.labels || {}) };
  const title = settings.title || 'Gallery';
  return ['few', 'all'].map(mode => ({
    path: path + (mode === 'few' ? '/index.html' : '/all/index.html'),
    layout: 'page',
    data: { title, comments: false, body_class: 'gallery-page', content: renderGallery(photos, this.config.root, { mode, path, title, labels }) }
  })).concat(['gallery.css', 'gallery.js', 'gallery-selection.js'].map(name => ({
    path: (name.endsWith('.css') ? 'css/' : 'js/') + name,
    data: () => readFileSync(join(this.theme_dir, 'modules/gallery/assets', name))
  })));
});

hexo.extend.filter.register('after_render:html', function(html) {
  if (!this.theme.config.gallery?.enable || !html.includes('class="gallery-collection"')) return html;
  const root = this.config.root.replace(/\/?$/, '/');
  return html.replace('</head>', '<link rel="stylesheet" href="' + root + 'css/gallery.css">\n</head>')
    .replace('</body>', (html.includes('data-gallery-model') ? '<script defer src="' + root + 'js/gallery-selection.js"></script>\n' : '') + '<script defer src="' + root + 'js/gallery.js"></script>\n</body>');
}, 40);
