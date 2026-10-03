/* Navigation: full-screen menu on narrow screens; no scroll-driven bar. */
(function() {
  'use strict';
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var toggle = nav.querySelector('.site-nav__toggle');
  var menu = nav.querySelector('.site-menu');
  var open = false;

  function setOpen(value) {
    var wasOpen = open;
    open = Boolean(value);
    var bn = window.BlueNote;
    if (bn.lockPage) { if (open) bn.lockPage('menu'); else bn.unlockPage('menu'); }
    nav.classList.toggle('site-nav--open', open);
    document.body.classList.toggle('mobile-menu-open', open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (wasOpen && !open && toggle && window.innerWidth < 768) toggle.focus({ preventScroll: true });
    if (menu && open) {
      Array.prototype.forEach.call(menu.children, function(entry, index) {
        entry.style.animationDelay = (index * 20) + 'ms';
      });
    }
  }

  if (toggle) {
    toggle.addEventListener('click', function() { setOpen(!open); });
  }
  if (menu) {
    menu.addEventListener('click', function(event) {
      var link = event.target.closest('a[href]');
      if (link && window.innerWidth < 768) setOpen(false);
    });
  }
  window.addEventListener('resize', function() {
    if (open && window.innerWidth >= 768) setOpen(false);
  });
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && open) setOpen(false);
    if (event.key === 'Tab' && open) {
      var items = Array.from(nav.querySelectorAll('a[href], button')).filter(function(el) {
        return el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
      });
      var first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  window.BlueNote = window.BlueNote || {};
  window.BlueNote.nav = {
    open: function() { setOpen(true); },
    close: function() { setOpen(false); },
    toggle: function() { setOpen(!open); },
    isOpen: function() { return open; }
  };
})();
