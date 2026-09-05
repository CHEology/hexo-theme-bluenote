/* global hexo */
'use strict';

function companionFor(page) {
  if (page.private_post || !page.companion) return null;
  const value = page.companion;
  if (typeof value !== 'object' || typeof value.label !== 'string' || !value.label.trim()) {
    throw new Error('companion requires a nonempty label and an HTTPS URL');
  }
  let url;
  try { url = new URL(value.url); } catch { throw new Error('companion requires a valid HTTPS URL'); }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('companion requires an HTTPS URL without credentials');
  }
  if (value.aria_label !== undefined && (typeof value.aria_label !== 'string' || !value.aria_label.trim())) {
    throw new Error('companion aria_label must be nonempty text');
  }
  return { url: url.href, label: value.label, aria_label: value.aria_label };
}

hexo.extend.helper.register('post_companion', companionFor);
hexo.extend.filter.register('before_generate', function() {
  this.model('Post').forEach(companionFor);
});
