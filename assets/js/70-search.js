/* Site search panel over the hexo-generator-search index. Private posts (an optional
   site feature) are hidden until the page announces `bluenote:private-unlocked`. */
(function() {
  'use strict';
  var config = window.BlueNote.config.search;
  if (!config || !config.enable) return;
  var labels = config.labels;
  var trigger = document.querySelector('a[href$="#site-search"]');
  if (!trigger) return;
  var entries = [];
  var privateByUrl = new Map();
  var unlockedPrivatePosts = [];
  var loadingPromise;
  var previousFocus;
  var inerted = [];
  var loading = false;
  var failed = false;

  function normalizedPath(value) {
    try {
      return new URL(value, window.location.origin).pathname.replace(/\/{2,}/g, '/');
    } catch (error) {
      return value;
    }
  }

  function cleanText(value) {
    var container = document.createElement('div');
    container.innerHTML = value || '';
    return (container.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function mergeUnlockedPrivatePosts() {
    unlockedPrivatePosts.forEach(function(post) {
      var publicPost = Array.from(privateByUrl.values()).find(function(item) { return item.id === post.id; });
      if (!publicPost) return;
      var entry = entries.find(function(item) { return normalizedPath(item.url) === normalizedPath(publicPost.url); });
      if (entry) entry.content = cleanText(post.html);
    });
  }

  function buildOverlay() {
    var element = document.createElement('div');
    element.className = 'site-search-overlay';
    element.dataset.searchOverlay = '';
    element.hidden = true;
    element.innerHTML = [
      '<section class="site-search-dialog" role="dialog" aria-modal="true">',
      '  <div class="site-search-dialog__field">',
      '    <svg class="icon site-search-dialog__icon" aria-hidden="true" focusable="false"><use href="#icon-search"></use></svg>',
      '    <input id="site-search-input" type="search" autocomplete="off">',
      '    <button class="site-search-dialog__close" type="button" data-search-close aria-label="Close search"></button>',
      '  </div>',
      '  <div class="site-search-results" data-search-results aria-live="polite"></div>',
      '</section>'
    ].join('');
    element.querySelector('section').setAttribute('aria-label', labels.title);
    element.querySelector('input').placeholder = labels.placeholder;
    element.querySelector('input').setAttribute('aria-label', labels.placeholder);
    element.querySelector('[data-search-close]').setAttribute('aria-label', labels.close);
    document.body.appendChild(element);
    return element;
  }

  var overlay = buildOverlay();
  var input = overlay.querySelector('#site-search-input');
  var results = overlay.querySelector('[data-search-results]');

  function loadIndex() {
    if (loadingPromise) return loadingPromise;
    loading = true;
    failed = false;
    renderResults();
    loadingPromise = Promise.all([
      fetch(config.path).then(function(response) {
        if (!response.ok) throw new Error('search-index-unavailable');
        return response.text();
      }),
      config.privateManifest ? fetch(config.privateManifest, { cache: 'no-store' }).then(function(response) {
        if (!response.ok) throw new Error('private-index-unavailable');
        return response.json();
      }) : Promise.resolve({ posts: [] })
    ]).then(function(values) {
      var xml = new DOMParser().parseFromString(values[0], 'application/xml');
      if (xml.querySelector('parsererror')) throw new Error('search-index-invalid');
      privateByUrl.clear();
      (values[1].posts || []).forEach(function(post) {
        privateByUrl.set(normalizedPath(post.url), post);
      });
      entries = Array.prototype.map.call(xml.querySelectorAll('entry'), function(entry) {
        var url = entry.querySelector('url') ? entry.querySelector('url').textContent : '';
        var privatePost = privateByUrl.get(normalizedPath(url));
        return {
          title: entry.querySelector('title') ? entry.querySelector('title').textContent.trim() : 'Untitled',
          content: cleanText(entry.querySelector('content') ? entry.querySelector('content').textContent : ''),
          url: privatePost ? privatePost.url : url,
          privatePost: privatePost
        };
      });
      mergeUnlockedPrivatePosts();
    }).catch(function() {
      entries = [];
      failed = true;
      loadingPromise = null;
    }).finally(function() {
      loading = false;
      if (!overlay.hidden) renderResults();
    });
    return loadingPromise;
  }

  function excerptAround(content, query) {
    var lower = content.toLowerCase();
    var position = lower.indexOf(query.toLowerCase());
    if (position < 0) position = 0;
    var start = Math.max(0, position - 32);
    var end = Math.min(content.length, position + 96);
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '');
  }

  function renderResults() {
    var query = input.value.trim().toLowerCase();
    results.replaceChildren();
    results.setAttribute('aria-busy', String(loading));
    if (loading || failed) {
      var status = document.createElement('p');
      status.className = 'site-search-status';
      status.textContent = loading ? labels.loading : labels.error;
      if (failed) {
        var retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = labels.retry;
        retry.addEventListener('click', function() { input.focus(); loadIndex(); });
        status.appendChild(retry);
      }
      results.appendChild(status);
      return;
    }
    if (!query) return;

    var unlocked = document.documentElement.classList.contains('private-reading-unlocked');
    var matches = entries.filter(function(entry) {
      if (entry.privatePost && !unlocked) return false;
      return entry.title.toLowerCase().includes(query) || entry.content.toLowerCase().includes(query);
    }).slice(0, 20);
    if (!matches.length) {
      var empty = document.createElement('p');
      empty.className = 'site-search-status';
      empty.textContent = labels.empty;
      results.appendChild(empty);
    }
    matches.forEach(function(entry) {
      var link = document.createElement('a');
      link.className = 'site-search-result';
      link.href = entry.url;
      if (entry.privatePost) link.classList.add('site-search-result--private');

      var heading = document.createElement('span');
      heading.className = 'site-search-result__title';
      heading.textContent = entry.title;
      link.appendChild(heading);

      if (entry.privatePost) {
        var lock = document.createElement('span');
        lock.className = 'site-search-result__privacy';
        var lockIcon = document.createElement('i');
        lockIcon.className = 'private-lock-icon';
        lockIcon.setAttribute('aria-hidden', 'true');
        lock.appendChild(lockIcon);
        lock.setAttribute('aria-label', unlocked ? labels.unlocked : labels.locked);
        link.appendChild(lock);
      } else if (entry.content) {
        var excerpt = document.createElement('span');
        excerpt.className = 'site-search-result__excerpt';
        excerpt.textContent = excerptAround(entry.content, query);
        link.appendChild(excerpt);
      }
      results.appendChild(link);
    });
  }

  function openSearch(source) {
    if (!overlay.hidden) return;
    previousFocus = source || document.activeElement;
    if (window.BlueNote.nav) window.BlueNote.nav.close();
    overlay.hidden = false;
    inerted = Array.from(document.body.children).filter(function(element) {
      return element !== overlay && !['SCRIPT', 'STYLE', 'LINK'].includes(element.tagName);
    }).map(function(element) {
      var record = { element: element, value: element.inert };
      element.inert = true;
      return record;
    });
    document.body.classList.add('search-dialog-open');
    loadIndex().then(renderResults);
    window.setTimeout(function() { input.focus(); }, 0);
  }

  function closeSearch() {
    overlay.hidden = true;
    document.body.classList.remove('search-dialog-open');
    input.value = '';
    results.replaceChildren();
    inerted.forEach(function(record) { record.element.inert = record.value; });
    inerted = [];
    var focusTarget = previousFocus;
    if (!focusTarget || getComputedStyle(focusTarget).visibility === 'hidden' || !focusTarget.getClientRects().length) {
      focusTarget = document.querySelector('.site-nav__toggle');
    }
    if (focusTarget && focusTarget.focus) focusTarget.focus();
  }

  document.addEventListener('click', function(event) {
    var searchLink = event.target.closest('a[href$="#site-search"]');
    if (searchLink) {
      event.preventDefault();
      openSearch(searchLink);
      return;
    }
    if (event.target.closest('[data-search-close]') || event.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', function(event) {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeSearch(); }
    if (event.key === 'Tab') {
      var focusable = Array.from(overlay.querySelectorAll('input, button, a[href]'));
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  input.addEventListener('input', renderResults);

  document.addEventListener('bluenote:private-unlocked', function(event) {
    if (!event.detail || !event.detail.posts) return;
    unlockedPrivatePosts = event.detail.posts;
    mergeUnlockedPrivatePosts();
    if (!overlay.hidden) renderResults();
  });

  window.BlueNote.search = { open: openSearch, close: closeSearch };
})();
