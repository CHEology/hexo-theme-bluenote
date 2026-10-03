/* global hexo */
'use strict';

/* Chinese text shares the Latin quotation marks, dashes and ellipsis (U+2014, U+2018–201D,
   U+2026). A Latin-first font stack draws them with the Latin face, so “背叛” gets narrow
   Western quotes and —— splits into two short dashes. When `cjk_punctuation` is on, each
   such mark that touches Chinese text is wrapped in <span class="cjk-punct">, which the
   theme sets in the Chinese face (--font-cjk). Marks inside Latin text, such as the
   apostrophe in “can’t”, keep the Latin face. Only the rendered HTML changes; the
   author's characters stay exactly as written. */

const MARK = /[—‘’“”…]/;
/* Han, CJK punctuation, full-width forms and kana. */
const CJK = /[⺀-⿟　-〿぀-ヿ㐀-䶿一-鿿豈-﫿︰-﹏＀-￯]/;
const SKIP = /^<(pre|code|script|style|math|svg|textarea|kbd|samp)\b/i;

function firstLetter(text, from, step) {
  for (let k = from; k >= 0 && k < text.length; k += step) {
    const ch = text[k];
    if (ch === '\u0000' || ch === '\n') return '';
    if (/\p{L}/u.test(ch) || CJK.test(ch)) return ch;
  }
  return '';
}

function decide(text) {
  /* text: visible characters with \u0000 standing for an opaque break (code, maths). */
  const wrap = new Array(text.length).fill(false);
  let i = 0;
  while (i < text.length) {
    if (!MARK.test(text[i])) { i += 1; continue; }
    let j = i;
    while (j + 1 < text.length && text[j + 1] === text[i]) j += 1;
    /* Nearest non-space neighbours, looking through other marks of the same group. */
    let before = i - 1;
    while (before >= 0 && (/\s/.test(text[before]) || MARK.test(text[before]))) before -= 1;
    let after = j + 1;
    while (after < text.length && (/\s/.test(text[after]) || MARK.test(text[after]))) after += 1;
    const prev = before >= 0 ? text[before] : '';
    const next = after < text.length ? text[after] : '';
    const ch = text[i];
    let chinese;
    if (ch === '’' && /[A-Za-z]/.test(text[i - 1] || '') && /[A-Za-z]/.test(text[j + 1] || '')) {
      chinese = false; /* an apostrophe inside a Latin word */
    } else {
      chinese = CJK.test(prev) || CJK.test(next);
      /* “1444，… opens a Chinese sentence with digits: decide a quote by the first
         letter it encloses (opening) or the last one (closing). */
      if (!chinese && /[‘“]/.test(ch)) chinese = CJK.test(firstLetter(text, j + 1, 1));
      if (!chinese && /[’”]/.test(ch)) chinese = CJK.test(firstLetter(text, i - 1, -1));
    }
    for (let k = i; k <= j; k += 1) wrap[k] = chinese;
    i = j + 1;
  }
  return wrap;
}

function cjkPunctuation(html) {
  if (!MARK.test(html)) return html;
  const tokens = html.split(/(<[^>]+>)/);
  /* Build the visible text, marking skipped regions as opaque breaks. */
  const pieces = [];
  let skipping = null;
  let depth = 0;
  tokens.forEach((token, index) => {
    if (index % 2 === 1) {
      const open = token.match(SKIP);
      if (skipping) {
        const name = token.match(/^<\/?([a-z0-9]+)/i);
        if (name && name[1].toLowerCase() === skipping) depth += token[1] === '/' ? -1 : (token.endsWith('/>') ? 0 : 1);
        if (depth === 0) skipping = null;
      } else if (open && !token.endsWith('/>')) {
        skipping = open[1].toLowerCase();
        depth = 1;
      }
      pieces.push({ index, skip: true });
      return;
    }
    pieces.push({ index, skip: Boolean(skipping) });
  });
  let text = '';
  const owners = [];
  pieces.forEach(piece => {
    if (piece.index % 2 === 1 || piece.skip) {
      if (piece.skip && piece.index % 2 === 0 && tokens[piece.index]) { text += '\u0000'; owners.push(null); }
      return;
    }
    const value = tokens[piece.index];
    for (let k = 0; k < value.length; k += 1) { text += value[k]; owners.push([piece.index, k]); }
  });
  const wrap = decide(text);
  const marks = new Map();
  wrap.forEach((yes, position) => {
    if (!yes || !owners[position]) return;
    const [index, offset] = owners[position];
    if (!marks.has(index)) marks.set(index, new Set());
    marks.get(index).add(offset);
  });
  marks.forEach((offsets, index) => {
    const value = tokens[index];
    let out = '';
    let k = 0;
    while (k < value.length) {
      if (!offsets.has(k)) { out += value[k]; k += 1; continue; }
      let end = k;
      while (offsets.has(end + 1)) end += 1;
      out += `<span class="cjk-punct">${value.slice(k, end + 1)}</span>`;
      k = end + 1;
    }
    tokens[index] = out;
  });
  return tokens.join('');
}

hexo.extend.filter.register('after_post_render', function(data) {
  if (!this.theme.config.cjk_punctuation) return data;
  if (data.content) data.content = cjkPunctuation(data.content);
  return data;
});

/* Templates mark text they assemble themselves, such as listing excerpts. */
hexo.extend.helper.register('cjk_punct', function(html) {
  return this.theme.cjk_punctuation ? cjkPunctuation(String(html || '')) : html;
});

module.exports = { cjkPunctuation };
