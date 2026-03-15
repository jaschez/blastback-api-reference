#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'public');
const CONTENT = path.join(SRC, 'content');

// ═══ Helpers ═══
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// ═══ Load all page definitions ═══
function loadPages() {
  const pages = [];
  function walk(dir, prefix) {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full, prefix ? prefix + '/' + f : f);
      } else if (f.endsWith('.json')) {
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        data._file = prefix ? prefix + '/' + f.replace('.json', '') : f.replace('.json', '');
        pages.push(data);
      }
    }
  }
  walk(CONTENT, '');
  return pages;
}

// ═══ Navigation structure ═══
function buildNav(pages, currentSlug) {
  const sections = {};
  for (const p of pages) {
    if (p.slug === 'index') continue; // Skip index from nav
    const sec = p.section || 'General';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(p);
  }

  const order = ['Getting Started', 'Core Concepts', 'Components', 'Models', 'Guides'];
  const sortedSections = Object.keys(sections).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  let html = '';
  for (const sec of sortedSections) {
    const items = sections[sec].sort((a, b) => (a.order || 99) - (b.order || 99));
    const hasSubgroups = {};

    // Group items by subsection
    for (const item of items) {
      const sub = item.subsection || '';
      if (!hasSubgroups[sub]) hasSubgroups[sub] = [];
      hasSubgroups[sub].push(item);
    }

    html += `<div class="sidebar-section">
      <div class="sidebar-section-title">${sec}</div>`;

    const subOrder = ['', 'Common', 'Mob', 'Weapon', 'UI'];
    const sortedSubs = Object.entries(hasSubgroups).sort((a, b) => {
      const ai = subOrder.indexOf(a[0]);
      const bi = subOrder.indexOf(b[0]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });

    for (const [sub, subItems] of sortedSubs) {
      if (sub) {
        const isOpen = subItems.some(i => i.slug === currentSlug);
        html += `<div class="sidebar-group${isOpen ? ' open' : ''}">
          <button class="sidebar-group-toggle">${sub} <span class="arrow">&#9656;</span></button>
          <div class="sidebar-group-items">`;
        for (const item of subItems) {
          const active = item.slug === currentSlug ? ' active' : '';
          html += `<a href="${getRelPath(currentSlug, item.slug)}" class="sidebar-link${active}">${item.navTitle || item.title}</a>`;
        }
        html += `</div></div>`;
      } else {
        for (const item of subItems) {
          const active = item.slug === currentSlug ? ' active' : '';
          html += `<a href="${getRelPath(currentSlug, item.slug)}" class="sidebar-link${active}">${item.navTitle || item.title}</a>`;
        }
      }
    }

    html += `</div>`;
  }
  return html;
}

function getRelPath(from, to) {
  // from and to are slugs like "index", "guides/getting-started", "reference/components/animator"
  const fromParts = from.split('/');
  const toParts = to.split('/');
  fromParts.pop(); // remove filename

  let ups = fromParts.length;
  let common = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length - 1); i++) {
    if (fromParts[i] === toParts[i]) common++;
    else break;
  }

  const prefix = '../'.repeat(ups - common);
  const suffix = toParts.slice(common).join('/');
  return (prefix || './') + suffix + '.html';
}

function buildToc(content) {
  const headings = [];
  const regex = /<h([23]) id="([^"]+)">([^<]+)<\/h[23]>/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    headings.push({ level: parseInt(m[1]), id: m[2], text: m[3] });
  }
  if (headings.length === 0) return '';
  let html = '<div class="toc-sidebar"><div class="toc-sidebar-title">On this page</div>';
  for (const h of headings) {
    html += `<a href="#${h.id}" class="depth-${h.level}">${h.text}</a>`;
  }
  html += '</div>';
  return html;
}

function buildSearchIndex(pages) {
  return pages.map(p => ({
    title: p.title,
    url: p.slug + '.html',
    category: p.section + (p.subsection ? ' > ' + p.subsection : ''),
    description: p.description || '',
    keywords: (p.keywords || []).join(' ')
  }));
}

// ═══ Page Template ═══
function renderPage(page, pages) {
  const slug = page.slug;
  const depth = slug.split('/').length - 1;
  const rootPrefix = depth > 0 ? '../'.repeat(depth) : './';
  const nav = buildNav(pages, slug);
  const toc = page.showToc !== false ? buildToc(page.content) : '';

  const breadcrumbParts = [];
  if (page.section) breadcrumbParts.push(page.section);
  if (page.subsection) breadcrumbParts.push(page.subsection);
  breadcrumbParts.push(page.title);

  const breadcrumb = breadcrumbParts.length > 1
    ? `<div class="breadcrumb">${breadcrumbParts.map((b, i) => i < breadcrumbParts.length - 1 ? `<a href="#">${b}</a><span class="sep">&#9656;</span>` : `<span>${b}</span>`).join('')}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | Blastback Engine Docs</title>
  <meta name="description" content="${page.description || 'Blastback Engine Lua scripting documentation'}">
  <link rel="stylesheet" href="${rootPrefix}assets/css/style.css">
  <link rel="icon" href="${rootPrefix}assets/images/favicon.ico" type="image/x-icon">
</head>
<body>
  <header class="site-header">
    <button class="mobile-menu-btn">&#9776;</button>
    <a href="${rootPrefix}index.html" class="header-logo">
      <svg viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#6c63ff"/><path d="M8 22V10l8 6-8 6zM16 22V10l8 6-8 6z" fill="white" fill-opacity="0.9"/></svg>
      Blastback Docs
    </a>
    <div class="header-nav">
      <div class="header-search">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" placeholder="Search docs..." readonly>
        <span class="search-shortcut">Ctrl+K</span>
      </div>
      <button class="theme-toggle">&#9790;</button>
    </div>
  </header>

  <aside class="sidebar">
    ${nav}
  </aside>

  <main class="main-content">
    <div class="content-wrapper">
      <div class="content">
        ${breadcrumb}
        ${page.content}
      </div>
      ${page.showFooterNav !== false ? buildFooterNav(page, pages) : ''}
    </div>
    ${toc}
  </main>

  <div class="search-modal-overlay">
    <div class="search-modal">
      <input type="text" class="search-modal-input" placeholder="Search documentation...">
      <div class="search-results"></div>
    </div>
  </div>

  <script>window.searchIndex = ${JSON.stringify(buildSearchIndex(pages))};</script>
  <script src="${rootPrefix}assets/js/main.js"></script>
</body>
</html>`;
}

function buildFooterNav(page, pages) {
  const ordered = pages
    .filter(p => p.slug !== 'index')
    .sort((a, b) => {
      const sa = (a.section || '') + (a.subsection || '') + String(a.order || 99);
      const sb = (b.section || '') + (b.subsection || '') + String(b.order || 99);
      return sa.localeCompare(sb);
    });

  const idx = ordered.findIndex(p => p.slug === page.slug);
  if (idx === -1) return '';

  const prev = idx > 0 ? ordered[idx - 1] : null;
  const next = idx < ordered.length - 1 ? ordered[idx + 1] : null;

  let html = '<div class="page-footer">';
  if (prev) html += `<a href="${getRelPath(page.slug, prev.slug)}">&#8592; ${prev.navTitle || prev.title}</a>`;
  else html += '<span></span>';
  if (next) html += `<a href="${getRelPath(page.slug, next.slug)}">${next.navTitle || next.title} &#8594;</a>`;
  else html += '<span></span>';
  html += '</div>';
  return html;
}

// ═══ Main Build ═══
function build() {
  console.log('Building Blastback Engine Docs...');

  // Clean output
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
  ensureDir(OUT);

  // Copy static assets
  copyDir(path.join(SRC, 'assets'), path.join(OUT, 'assets'));

  // Load pages
  const pages = loadPages();
  console.log(`Found ${pages.length} pages`);

  // Build each page
  for (const page of pages) {
    const outPath = path.join(OUT, page.slug + '.html');
    ensureDir(path.dirname(outPath));
    const html = renderPage(page, pages);
    fs.writeFileSync(outPath, html);
    console.log(`  Built: ${page.slug}.html`);
  }

  // Copy favicon if exists
  const favicon = path.join(SRC, 'assets', 'images', 'favicon.ico');
  if (fs.existsSync(favicon)) {
    fs.copyFileSync(favicon, path.join(OUT, 'favicon.ico'));
  }

  console.log(`\nDone! ${pages.length} pages built to ${OUT}`);
}

build();
