/* Letterbox home: the lower bar shows the excerpt of the entry under the pointer or focus,
   and returns to the slogan when the pointer leaves the index. One line, fixed height:
   only the words change. */
(function() {
  'use strict';
  var root = document.documentElement;
  if (root.getAttribute('data-design') !== 'letterbox') return;
  var dock = document.querySelector('.letterbox-dock');
  var index = document.querySelector('.letterbox-index');
  if (!dock || !index) return;
  var line = dock.querySelector('.letterbox-dock__line span');
  var idle = line.textContent;
  var wanted = idle;
  var wait = 0;
  var swap = 0;
  var wide = window.matchMedia('(min-width: 768px) and (min-height: 521px)');

  function show(text) {
    line.textContent = text;
    dock.classList.toggle('is-idle', text === idle);
  }

  function say(text) {
    if (text === wanted) return;
    wanted = text;
    clearTimeout(wait);
    clearTimeout(swap);
    /* A short pause so sweeping across the grid does not flicker. */
    wait = setTimeout(function() {
      if (window.BlueNote.reduceMotion()) { show(wanted); return; }
      dock.classList.add('is-swapping');
      swap = setTimeout(function() {
        show(wanted);
        dock.classList.remove('is-swapping');
      }, 120);
    }, 80);
  }

  function pick(event) {
    if (!wide.matches) return;
    var link = event.target.closest('.letterbox-entry__link');
    if (link) say(link.getAttribute('data-excerpt') || idle);
  }

  index.addEventListener('pointerover', pick);
  index.addEventListener('focusin', pick);
  index.addEventListener('pointerleave', function() { say(idle); });
  index.addEventListener('focusout', function(event) {
    if (!index.contains(event.relatedTarget)) say(idle);
  });
  dock.classList.add('is-idle');

  /* A hairline marks the bars only once writing passes beneath them. */
  var ticking = false;
  function update() {
    root.classList.toggle('letterbox-scrolled', window.scrollY > 1);
    ticking = false;
  }
  window.addEventListener('scroll', function() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }, { passive: true });
  update();
})();
