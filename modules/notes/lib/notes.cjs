'use strict';
/* Optional Notes: short timestamped texts kept apart from posts. The site owns the
   Markdown files; this module validates them and renders the timeline markup. */
const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const frontMatter = require('hexo-front-matter');
const moment = require('moment-timezone');
const { escapeHTML, stripHTML } = require('hexo-util');

const ID = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const DATE_FORMATS = ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm', 'YYYY-MM-DDTHH:mm:ssZ', 'YYYY-MM-DDTHH:mm:ss.SSSZ'];

function rawValue(block, field) {
  const match = block.match(new RegExp('^' + field + ':\\s*(.+?)\\s*$', 'm'));
  return match ? match[1].replace(/^(['"])(.*)\1$/, '$2') : '';
}

function validTag(tag) {
  return typeof tag === 'string' && tag.trim() === tag && tag.length > 0 && tag.length <= 40 &&
    !/[\/\\?#%<>"'`\s]/.test(tag) && !tag.startsWith('.');
}

/* Reads every `<id>.md` in the notes folder. Throws on anything ambiguous so a bad
   note fails the build instead of quietly disappearing from the timeline. */
function loadNotes(directory, timezone) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).filter((name) => name.endsWith('.md')).sort().map((filename) => {
    const id = filename.slice(0, -3);
    if (!ID.test(id)) throw new Error(`Note filenames must be URL-safe ids (letters, digits, hyphens): ${filename}`);
    const raw = readFileSync(join(directory, filename), 'utf8').replace(/^﻿/, '');
    const block = (raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/) || [])[1];
    if (block === undefined) throw new Error(`Note needs front matter with a date: ${filename}`);
    const parsed = frontMatter.parse(raw);
    const dateText = rawValue(block, 'date');
    const date = moment.tz(dateText, DATE_FORMATS, true, timezone);
    if (!date.isValid()) throw new Error(`Note date must be YYYY-MM-DD HH:mm:ss: ${filename}`);
    const updatedText = rawValue(block, 'updated');
    const updated = updatedText ? moment.tz(updatedText, DATE_FORMATS, true, timezone) : null;
    if (updated && !updated.isValid()) throw new Error(`Note updated date must be YYYY-MM-DD HH:mm:ss: ${filename}`);
    const tags = parsed.tags === undefined || parsed.tags === null ? [] : Array.isArray(parsed.tags) ? parsed.tags : [parsed.tags];
    tags.forEach((tag) => {
      if (!validTag(tag)) throw new Error(`Note tags must be short words without spaces, slashes or quotes: ${filename}`);
    });
    const body = String(parsed._content || '').replace(/^\s+|\s+$/g, '');
    if (!body) throw new Error(`Note is empty: ${filename}`);
    return { id, filename, date, updated, tags: [...new Set(tags)], body, raw };
  }).sort((a, b) => b.date.valueOf() - a.date.valueOf() || b.id.localeCompare(a.id));
}

function tagCounts(notes) {
  const counts = new Map();
  notes.forEach((note) => note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
  return [...counts].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function format(template, values) {
  return String(template).replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
}

function renderNote(note, urls, options) {
  const tags = note.tags.length
    ? `<ul class="note__tags">${note.tags.map((tag) =>
      `<li><a href="${urls.tag(tag)}">#${escapeHTML(tag)}</a></li>`).join('')}</ul>`
    : '';
  return [
    `<article class="note" id="note-${note.id}" data-note-id="${note.id}" data-note-file="${escapeHTML(note.filename)}">`,
    `<header class="note__meta"><a class="note__date" href="${urls.note(note.id)}"><time datetime="${note.date.format()}">${escapeHTML(note.date.format(options.dateFormat))}</time></a></header>`,
    `<div class="note__body markdown-body">${note.html}</div>`,
    tags,
    '</article>'
  ].join('');
}

function renderTagNav(tags, urls, labels, current) {
  if (!tags.length) return '';
  const all = `<li><a href="${urls.timeline()}"${current ? '' : ' aria-current="page"'}>${escapeHTML(labels.all)}</a></li>`;
  return `<nav class="notes-tags" aria-label="${escapeHTML(labels.tags)}"><ul>${all}${tags.map((tag) =>
    `<li><a href="${urls.tag(tag.name)}"${tag.name === current ? ' aria-current="page"' : ''}>#${escapeHTML(tag.name)}<span class="notes-tags__count">${tag.count}</span></a></li>`
  ).join('')}</ul></nav>`;
}

/* One timeline page: optional composer mount, search, tag filter, the notes and paging. */
function renderTimeline(notes, allTags, urls, options) {
  const { labels } = options;
  const composer = options.compose && options.composer
    ? `<div class="notes-composer" data-notes-composer data-repo="${escapeHTML(options.compose.repo)}" data-branch="${escapeHTML(options.compose.branch)}" data-dir="${escapeHTML(options.compose.dir)}" data-tags-url="${urls.asset('tags.json')}" hidden></div>`
    : '';
  const search = options.search ? [
    `<form class="notes-search" role="search" data-notes-search hidden>`,
    `<label class="visually-hidden" for="notes-search-input">${escapeHTML(labels.search)}</label>`,
    `<input id="notes-search-input" type="search" autocomplete="off" spellcheck="false" placeholder="${escapeHTML(labels.search)}">`,
    `<p class="notes-search__status" aria-live="polite"></p>`,
    '</form>',
    '<div class="notes-results" data-notes-results hidden></div>'
  ].join('') : '';
  const list = notes.length
    ? `<ol class="notes-list" data-notes-list>${notes.map((note) => `<li>${renderNote(note, urls, options)}</li>`).join('')}</ol>`
    : `<p class="notes-empty" data-notes-list>${escapeHTML(labels.empty)}</p>`;
  const paging = options.newer || options.older
    ? `<nav class="notes-pagination" aria-label="${escapeHTML(labels.pages)}" data-notes-pagination>${options.newer ? `<a class="notes-pagination__newer" href="${options.newer}" rel="prev">${escapeHTML(labels.newer)}</a>` : '<span></span>'}${options.older ? `<a class="notes-pagination__older" href="${options.older}" rel="next">${escapeHTML(labels.older)}</a>` : '<span></span>'}</nav>`
    : '';
  const data = [
    `data-notes`,
    options.search ? `data-search-url="${urls.asset('search.json')}" data-tag-base="${urls.asset('tags/')}"` : '',
    `data-label-results="${escapeHTML(labels.results)}"`,
    `data-label-no-results="${escapeHTML(labels.no_results)}"`,
    `data-label-loading="${escapeHTML(labels.loading)}"`,
    `data-label-error="${escapeHTML(labels.error)}"`
  ].filter(Boolean).join(' ');
  return `<div class="notes" ${data}>${composer}${search}${renderTagNav(allTags, urls, labels, options.currentTag)}${list}${paging}</div>`;
}

function renderSingle(note, allTags, urls, options) {
  return `<div class="notes notes--single" data-notes><p class="notes-back"><a href="${urls.timeline()}">${escapeHTML(options.labels.back)}</a></p><div class="notes-list">${renderNote(note, urls, options)}</div></div>`;
}

function searchIndex(notes, urls, options) {
  return {
    version: 1,
    notes: notes.map((note) => ({
      id: note.id,
      url: urls.note(note.id),
      file: note.filename,
      datetime: note.date.format(),
      date: note.date.format(options.dateFormat),
      tags: note.tags,
      text: stripHTML(note.html).replace(/\s+/g, ' ').trim(),
      html: note.html
    }))
  };
}

module.exports = { loadNotes, tagCounts, renderTimeline, renderSingle, renderNote, searchIndex, format, validTag };
