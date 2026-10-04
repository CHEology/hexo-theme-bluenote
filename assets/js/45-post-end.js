(function() {
  'use strict';
  // Private content is rendered only after decryption; never retain its text.
  function placePrivateEnd() {
    var template = document.querySelector('[data-post-end-template]');
    var content = document.querySelector('[data-private-post-content]:not([hidden])');
    if (!template || !content || content.querySelector('.post-end')) return;
    var node = content;
    while (node === content || /^(DIV|SECTION|ARTICLE|BLOCKQUOTE|UL|OL)$/.test(node.tagName)) {
      var children = Array.from(node.childNodes).filter(function(child) {
        return child.nodeType === 1 || (child.nodeType === 3 && child.textContent.trim());
      });
      if (!children.length) break;
      node = children[children.length - 1];
    }
    var link = template.content.firstElementChild.cloneNode(true);
    if (/^(P|LI)$/.test(node.tagName) && node.textContent.trim() && !node.querySelector('img,figure,video,audio,iframe,pre,table,svg,math')) {
      node.appendChild(link);
    } else {
      var line = document.createElement('div');
      line.className = 'post-end-line';
      line.appendChild(link);
      content.appendChild(line);
    }
  }
  document.addEventListener('bluenote:private-unlocked', placePrivateEnd);
  window.BlueNote.ready(placePrivateEnd);
})();
