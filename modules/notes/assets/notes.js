/* Optional Notes: the notes pages' own search, separate from the site search.
   The index (search.json) loads on first use; without JavaScript the search box stays
   hidden and the timeline, tags and paging work as plain links. */
(function() {
  'use strict';
  var root = document.querySelector('.notes[data-search-url]');
  if (!root) return;
  var form = root.querySelector('[data-notes-search]');
  var input = form && form.querySelector('input');
  var status = form && form.querySelector('.notes-search__status');
  var results = root.querySelector('[data-notes-results]');
  if (!form || !input || !results) return;

  var hidden = Array.prototype.slice.call(root.querySelectorAll('[data-notes-list], [data-notes-pagination], .notes-tags'));
  var url = root.getAttribute('data-search-url');
  var tagBase = root.getAttribute('data-tag-base') || '';
  var labels = {
    results: root.getAttribute('data-label-results') || '{count}',
    none: root.getAttribute('data-label-no-results') || '',
    loading: root.getAttribute('data-label-loading') || '',
    error: root.getAttribute('data-label-error') || ''
  };
  var index = null;
  var pending = null;
  var timer = 0;
  var generation = 0;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function load() {
    if (index) return Promise.resolve(index);
    if (!pending) {
      pending = fetch(url, { cache: 'no-cache' }).then(function(response) {
        if (!response.ok) throw new Error('unavailable');
        return response.json();
      }).then(function(data) {
        index = (data.notes || []).map(function(note) {
          note.haystack = (note.text + ' ' + note.tags.map(function(tag) { return '#' + tag; }).join(' ')).toLowerCase();
          return note;
        });
        return index;
      }).catch(function(error) {
        pending = null;
        throw error;
      });
    }
    return pending;
  }

  function renderNote(note) {
    var tags = note.tags.length ? '<ul class="note__tags">' + note.tags.map(function(tag) {
      return '<li><a href="' + encodeURI(tagBase + tag + '/') + '">#' + escapeHTML(tag) + '</a></li>';
    }).join('') + '</ul>' : '';
    return '<li><article class="note" data-note-id="' + escapeHTML(note.id) + '" data-note-file="' + escapeHTML(note.file) + '">' +
      '<header class="note__meta"><a class="note__date" href="' + escapeHTML(note.url) + '"><time datetime="' + escapeHTML(note.datetime) + '">' + escapeHTML(note.date) + '</time></a></header>' +
      '<div class="note__body markdown-body">' + note.html + '</div>' + tags + '</article></li>';
  }

  function showTimeline() {
    results.hidden = true;
    results.innerHTML = '';
    status.textContent = '';
    hidden.forEach(function(element) { element.hidden = false; });
  }

  function search(query) {
    var current = ++generation;
    var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      showTimeline();
      return;
    }
    if (!index) status.textContent = labels.loading;
    load().then(function(notes) {
      if (current !== generation) return;
      var matches = notes.filter(function(note) {
        return terms.every(function(term) { return note.haystack.indexOf(term) !== -1; });
      });
      hidden.forEach(function(element) { element.hidden = true; });
      results.hidden = false;
      results.innerHTML = matches.length ? '<ol class="notes-list">' + matches.map(renderNote).join('') + '</ol>' : '';
      status.textContent = matches.length ? labels.results.replace('{count}', matches.length) : labels.none;
      root.dispatchEvent(new CustomEvent('bluenote:notes-rendered', { bubbles: true }));
    }).catch(function() {
      if (current === generation) status.textContent = labels.error;
    });
  }

  form.hidden = false;
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    window.clearTimeout(timer);
    search(input.value);
  });
  input.addEventListener('input', function() {
    window.clearTimeout(timer);
    timer = window.setTimeout(function() { search(input.value); }, 120);
  });
  input.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && input.value) {
      input.value = '';
      search('');
    }
  });

  var initial = new URLSearchParams(window.location.search).get('q');
  if (initial) {
    input.value = initial;
    search(initial);
  }

  // A composer that publishes a note can ask the next search to reload the index.
  window.BlueNoteNotes = {
    reset: function() {
      index = null;
      pending = null;
      if (input.value) search(input.value);
    }
  };
})();
