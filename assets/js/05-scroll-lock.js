/* Freeze the document behind a modal without moving fixed navigation or losing the
   reading position. Shared by menus, search and image viewers in the letterbox design. */
(function() {
  'use strict';
  if (document.documentElement.dataset.design !== 'letterbox') return;
  var owners = new Set();
  var saved;
  var properties = ['position', 'top', 'width', 'height', 'overflow'];
  var body = document.body;
  window.BlueNote.lockPage = function(owner) {
    if (owners.has(owner)) return;
    if (!owners.size) {
      saved = { y: window.scrollY, styles: {} };
      properties.forEach(function(key) { saved.styles[key] = body.style[key]; });
      body.style.position = 'fixed';
      body.style.top = -saved.y + 'px';
      body.style.width = '100%';
      body.style.height = 'auto';
      body.style.overflow = 'hidden';
    }
    owners.add(owner);
  };
  window.BlueNote.unlockPage = function(owner) {
    if (!owners.delete(owner) || owners.size || !saved) return;
    var y = saved.y;
    properties.forEach(function(key) { body.style[key] = saved.styles[key]; });
    saved = null;
    window.scrollTo(0, y);
  };
})();
