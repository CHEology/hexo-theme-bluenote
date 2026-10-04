/* global hexo */
'use strict';

const {parseDocument} = require('htmlparser2');
const {escapeHTML} = require('hexo-util');
const containers = new Set(['div', 'section', 'article', 'blockquote', 'ul', 'ol']);
const media = new Set(['img', 'figure', 'video', 'audio', 'iframe', 'pre', 'table', 'svg', 'math']);
const text = node => node.type === 'text' ? node.data : (node.children || []).map(text).join('');
const hasMedia = node => media.has(node.name) || (node.children || []).some(hasMedia);

hexo.extend.helper.register('post_end_link', function() {
  const label = escapeHTML(this.__('post.back_to_top'));
  return `<a class="post-end" href="#page-top" aria-label="${label}" title="${label}">&nbsp;<span aria-hidden="true"></span></a>`;
});

hexo.extend.helper.register('post_content_with_end', function(page) {
  const html = page.content || '';
  if (page.private_post) return html;
  let node = parseDocument(html, {withStartIndices: true, withEndIndices: true});
  while (node.type === 'root' || containers.has(node.name)) {
    const children = (node.children || []).filter(child => child.type !== 'comment' && (child.type !== 'text' || child.data.trim()));
    if (!children.length) break;
    node = children[children.length - 1];
  }
  const link = this.post_end_link();
  // Splice into the original HTML: never reserialize or change authored text.
  if (['p', 'li'].includes(node.name) && text(node).trim() && !hasMedia(node)) {
    const end = html.lastIndexOf('</' + node.name, node.endIndex);
    if (end >= node.startIndex) return html.slice(0, end) + link + html.slice(end);
  }
  return html + `<div class="post-end-line">${link}</div>`;
});
