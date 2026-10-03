/* Letterbox home: the lower bar shows the excerpt of the entry under the pointer or focus,
   and returns to the slogan when the pointer or focus leaves an entry. Fixed height:
   only the words change. */
(function() {
  'use strict';
  var root = document.documentElement;
  if (root.getAttribute('data-design') !== 'letterbox') return;
  var dock = document.querySelector('.letterbox-dock');
  var index = document.querySelector('.letterbox-index');
  if (!dock || !index) return;
  /* home.subtitle_excerpts: false — the slogan stays. */
  if (dock.getAttribute('data-excerpts') === 'false') return;
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
      if (window.BlueNote.reduceMotion()) {
        show(wanted);
        dock.classList.remove('is-swapping');
        return;
      }
      dock.classList.add('is-swapping');
      swap = setTimeout(function() {
        show(wanted);
        dock.classList.remove('is-swapping');
      }, 120);
    }, 80);
  }

  function pick(target) {
    var link = target && target.closest && target.closest('.letterbox-entry__link');
    say(wide.matches && link && index.contains(link) ? link.getAttribute('data-excerpt') || idle : idle);
  }

  index.addEventListener('pointerover', function(event) { pick(event.target); });
  index.addEventListener('focusin', function(event) { pick(event.target); });
  index.addEventListener('pointerout', function(event) { pick(event.relatedTarget); });
  index.addEventListener('pointerleave', function() { say(idle); });
  index.addEventListener('focusout', function(event) { pick(event.relatedTarget); });
  wide.addEventListener('change', function() { say(idle); });
  dock.classList.add('is-idle');

})();
