/* Blastback Engine Docs - Interactive Features */
(function() {
  'use strict';

  // ═══ Theme Toggle ═══
  const theme = localStorage.getItem('bb-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);

  document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', function() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('bb-theme', next);
        toggle.innerHTML = next === 'dark' ? '&#9790;' : '&#9728;';
      });
      toggle.innerHTML = theme === 'dark' ? '&#9790;' : '&#9728;';
    }

    // ═══ Mobile Menu ═══
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (menuBtn && sidebar) {
      menuBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open');
      });
      document.addEventListener('click', function(e) {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }

    // ═══ Sidebar Groups ═══
    document.querySelectorAll('.sidebar-group-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        this.parentElement.classList.toggle('open');
      });
    });

    // Auto-open sidebar group for current page
    var activeLink = document.querySelector('.sidebar-link.active');
    if (activeLink) {
      var group = activeLink.closest('.sidebar-group');
      if (group) group.classList.add('open');
    }

    // ═══ Copy Code Buttons ═══
    document.querySelectorAll('pre code').forEach(function(block) {
      var wrapper = block.closest('pre');
      if (!wrapper) return;
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.style.position = 'absolute';
      btn.style.top = '8px';
      btn.style.right = '8px';
      wrapper.style.position = 'relative';
      wrapper.appendChild(btn);
      btn.addEventListener('click', function() {
        navigator.clipboard.writeText(block.textContent).then(function() {
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
        });
      });
    });

    // ═══ Search ═══
    var searchOverlay = document.querySelector('.search-modal-overlay');
    var searchInput = document.querySelector('.search-modal-input');
    var searchResults = document.querySelector('.search-results');
    var headerSearchInput = document.querySelector('.header-search input');

    function openSearch() {
      if (searchOverlay) {
        searchOverlay.classList.add('active');
        if (searchInput) searchInput.focus();
      }
    }

    function closeSearch() {
      if (searchOverlay) {
        searchOverlay.classList.remove('active');
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '';
      }
    }

    if (headerSearchInput) {
      headerSearchInput.addEventListener('focus', function() {
        this.blur();
        openSearch();
      });
    }

    if (searchOverlay) {
      searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) closeSearch();
      });
    }

    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    });

    if (searchInput && typeof window.searchIndex !== 'undefined') {
      searchInput.addEventListener('input', function() {
        var query = this.value.toLowerCase().trim();
        if (!searchResults) return;
        if (query.length < 2) {
          searchResults.innerHTML = '';
          return;
        }
        var results = window.searchIndex.filter(function(item) {
          return item.title.toLowerCase().indexOf(query) !== -1 ||
                 (item.description && item.description.toLowerCase().indexOf(query) !== -1) ||
                 (item.keywords && item.keywords.toLowerCase().indexOf(query) !== -1);
        }).slice(0, 10);

        if (results.length === 0) {
          searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
          return;
        }

        searchResults.innerHTML = results.map(function(item) {
          return '<a href="' + item.url + '" class="search-result-item">' +
            '<div class="search-result-title">' + escapeHtml(item.title) + '</div>' +
            '<div class="search-result-category">' + escapeHtml(item.category || '') + '</div>' +
            '</a>';
        }).join('');
      });
    }

    // ═══ Table of Contents Scroll Spy ═══
    var tocLinks = document.querySelectorAll('.toc-sidebar a');
    if (tocLinks.length > 0) {
      var headings = [];
      tocLinks.forEach(function(link) {
        var id = link.getAttribute('href');
        if (id && id.startsWith('#')) {
          var el = document.getElementById(id.slice(1));
          if (el) headings.push({ el: el, link: link });
        }
      });

      window.addEventListener('scroll', function() {
        var scrollPos = window.scrollY + 100;
        var current = null;
        headings.forEach(function(h) {
          if (h.el.offsetTop <= scrollPos) current = h;
        });
        tocLinks.forEach(function(l) { l.classList.remove('active'); });
        if (current) current.link.classList.add('active');
      });
    }
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
