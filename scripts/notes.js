/* Optional Notes: content belongs to the site; the module owns rendering. */
'use strict';
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const notesLib = require('../modules/notes/lib/notes.cjs');
const translations = require('../modules/notes/labels.json');

function settingsFor(ctx) {
  const settings = ctx.theme.config.notes || {};
  const path = String(settings.path || 'notes').replace(/^\/+|\/+$/g, '');
  const dir = String(settings.dir || '_notes').replace(/^\/+|\/+$/g, '');
  if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/i.test(path) || !/^_[a-z0-9_-]+$/i.test(dir)) {
    throw new Error('Notes path must be a local URL-safe name, and dir an underscore folder inside source.');
  }
  const locale = settings.language || (Array.isArray(ctx.config.language) ? ctx.config.language[0] : ctx.config.language);
  const labels = { ...translations.en, ...(translations[locale] || {}), ...(settings.labels || {}) };
  const compose = settings.compose && settings.compose.repo ? {
    repo: String(settings.compose.repo),
    branch: String(settings.compose.branch || 'main'),
    dir: [String(ctx.config.source_dir || 'source').replace(/\/+$/, ''), dir].join('/')
  } : null;
  if (compose && !/^[\w.-]+\/[\w.-]+$/.test(compose.repo)) throw new Error('notes.compose.repo must be owner/name.');
  return {
    enable: Boolean(settings.enable),
    path,
    dir,
    title: settings.title || 'Notes',
    perPage: Number.isInteger(settings.per_page) && settings.per_page >= 0 ? settings.per_page : 30,
    dateFormat: settings.date_format || 'YYYY.MM.DD HH:mm',
    noindex: settings.noindex !== false,
    search: settings.search !== false,
    labels,
    compose
  };
}

hexo.extend.generator.register('bluenote-notes', async function() {
  const s = settingsFor(this);
  if (!s.enable) return [];
  const root = this.config.root.replace(/\/?$/, '/');
  const base = root + s.path + '/';
  const urls = {
    timeline: () => base,
    page: (n) => (n <= 1 ? base : base + 'page/' + n + '/'),
    note: (id) => base + id + '/',
    tag: (tag) => encodeURI(base + 'tags/' + tag + '/'),
    asset: (name) => base + name
  };
  const notes = notesLib.loadNotes(join(this.source_dir, s.dir), this.config.timezone || 'UTC');
  // Render through Hexo's post pipeline so tag plugins and post filters apply, as in articles.
  for (const note of notes) {
    const rendered = await this.post.render(join(this.source_dir, s.dir, note.filename), {
      content: note.body, engine: 'markdown', note: true
    });
    // Site-root links in a note ("/2026/10/01/post/") follow the site root, like its images.
    note.html = rendered.content.trim().replace(/(<a\b[^>]*?\bhref=")\/(?!\/)([^"]*)"/g, (match, start, rest) =>
      root !== '/' && ('/' + rest).startsWith(root) ? match : start + root + rest + '"');
  }
  const tags = notesLib.tagCounts(notes);
  const options = { labels: s.labels, dateFormat: s.dateFormat, compose: s.compose, search: s.search };
  const page = (path, content, extra = {}) => ({
    path,
    layout: 'page',
    data: { title: s.title, comments: false, body_class: 'notes-page', noindex: s.noindex, content, ...extra }
  });

  const routes = [];
  const pages = s.perPage ? Math.max(1, Math.ceil(notes.length / s.perPage)) : 1;
  for (let n = 1; n <= pages; n += 1) {
    const slice = s.perPage ? notes.slice((n - 1) * s.perPage, n * s.perPage) : notes;
    const html = notesLib.renderTimeline(slice, tags, urls, {
      ...options,
      composer: n === 1,
      newer: n > 1 ? urls.page(n - 1) : '',
      older: n < pages ? urls.page(n + 1) : ''
    });
    routes.push(page((n === 1 ? s.path : s.path + '/page/' + n) + '/index.html', html));
  }
  notes.forEach((note) => routes.push(page(s.path + '/' + note.id + '/index.html',
    notesLib.renderSingle(note, tags, urls, options), { description: notesLib.searchIndex([note], urls, options).notes[0].text.slice(0, 120) })));
  tags.forEach((tag) => routes.push(page(s.path + '/tags/' + tag.name + '/index.html',
    notesLib.renderTimeline(notes.filter((note) => note.tags.includes(tag.name)), tags, urls, { ...options, composer: false, currentTag: tag.name }),
    { title: s.title + ' · #' + tag.name })));
  routes.push({ path: s.path + '/search.json', data: () => JSON.stringify(notesLib.searchIndex(notes, urls, options)) });
  routes.push({ path: s.path + '/tags.json', data: () => JSON.stringify({ version: 1, tags }) });
  ['notes.css', 'notes.js'].forEach((name) => routes.push({
    path: (name.endsWith('.css') ? 'css/' : 'js/') + name,
    data: () => readFileSync(join(this.theme_dir, 'modules/notes/assets', name))
  }));
  return routes;
});

hexo.extend.filter.register('after_render:html', function(html) {
  if (!this.theme.config.notes?.enable || !html.includes('<div class="notes')) return html;
  const root = this.config.root.replace(/\/?$/, '/');
  return html.replace('</head>', '<link rel="stylesheet" href="' + root + 'css/notes.css">\n</head>')
    .replace('</body>', '<script defer src="' + root + 'js/notes.js"></script>\n</body>');
}, 40);

module.exports = { settingsFor };
