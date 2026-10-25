// Projects page: filter dropdown
function applyFilter(f) {
  document.querySelectorAll('.card[data-cat]').forEach((card) => {
    card.hidden = f !== 'all' && !card.dataset.cat.split(' ').includes(f);
  });
  const sel = document.getElementById('filterSelect');
  if (sel) sel.value = f;
  if (window.projTilesRefresh) window.projTilesRefresh(true);
}
const filterSelect = document.getElementById('filterSelect');
if (filterSelect) filterSelect.addEventListener('change', () => applyFilter(filterSelect.value));

// About page: collapsible sections
document.querySelectorAll('.fold-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const fold = btn.closest('.fold');
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    fold.classList.toggle('closed', open);
    const hint = btn.querySelector('.fold-hint');
    if (hint) hint.textContent = open ? 'click to open' : 'click to close';
  });
});

// About page: highlight "contact" in the menu while the contact card is on screen
const contactCard = document.getElementById('contact');
if (contactCard && 'IntersectionObserver' in window) {
  const aboutLinks = document.querySelectorAll('a[href="about.html"]');
  const contactLinks = document.querySelectorAll('a[data-contact]');
  const setCurrent = (links, on) => links.forEach((a) => (on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  new IntersectionObserver((entries) => {
    const onScreen = entries[entries.length - 1].isIntersecting;
    setCurrent(contactLinks, onScreen);
    setCurrent(aboutLinks, !onScreen);
  }, { threshold: 0.15 }).observe(contactCard);
}

// About page: copy email
const copyBtn = document.getElementById('copy-email');
if (copyBtn) {
  copyBtn.addEventListener('click', () => {
    const done = () => {
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 1800);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyBtn.dataset.email).then(done, () => { copyBtn.textContent = copyBtn.dataset.email; });
    } else {
      copyBtn.textContent = copyBtn.dataset.email;
    }
  });
}

// Home page: slot-machine roll for the stat numbers
document.querySelectorAll('.stat b').forEach((el, n) => {
  const text = el.textContent;
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const strips = [];
  let digits = 0;
  [...text].forEach((ch) => {
    const out = document.createElement('span');
    out.setAttribute('aria-hidden', 'true');
    if (/\d/.test(ch)) {
      const loops = 2 + digits;
      out.className = 'reel';
      const strip = document.createElement('span');
      strip.className = 'reel-strip';
      for (let i = 0; i < loops * 10 + 10; i++) {
        const d = document.createElement('span');
        d.textContent = i % 10;
        strip.appendChild(d);
      }
      out.appendChild(strip);
      strips.push([strip, loops * 10 + Number(ch), digits]);
      digits++;
    } else {
      out.textContent = ch;
    }
    el.appendChild(out);
  });
  const roll = () => {
    void el.offsetHeight; // commit the start position so the transition runs on reload
    requestAnimationFrame(() => requestAnimationFrame(() => strips.forEach(([strip, idx, i]) => {
      strip.style.transitionDelay = `${n * 0.25 + i * 0.12}s`;
      strip.style.transform = `translateY(${-idx * 1.1}em)`;
    })));
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); roll(); }
    }, { threshold: 0.4 });
    io.observe(el);
  } else {
    roll();
  }
});

// Projects page: list / tiles view with a swipeable single-tile viewer
(() => {
  const grid = document.getElementById('projGrid');
  if (!grid) return;
  const nav = document.getElementById('tileNav');
  const dots = document.getElementById('tileDots');
  const count = document.getElementById('tileCount');
  const prev = document.getElementById('tilePrev');
  const next = document.getElementById('tileNext');
  const GAP = 14;
  const SWIPE = 180;
  let tiles = false, i = 0, dx = 0, dy = 0, startX = null, startY = null, axis = null, moved = false;
  const msg = document.createElement('div');
  msg.className = 'go-msg';
  msg.setAttribute('aria-hidden', 'true');
  msg.textContent = '↑ Going to details…';
  document.body.appendChild(msg);
  const linkOf = (c) => c && c.querySelector('.card-link');

  const cards = () => [...grid.querySelectorAll('.card')].filter((c) => !c.hidden);

  function place(animate = true) {
    const cs = cards();
    if (!tiles || !cs.length) return;
    i = Math.max(0, Math.min(cs.length - 1, i));
    const w = cs[0].offsetWidth;
    const stage = grid.parentElement.clientWidth;
    grid.style.transition = animate ? '' : 'none';
    grid.style.transform = `translateX(${(stage - w) / 2 - i * (w + GAP) + dx}px)`;
    cs.forEach((c, k) => {
      c.classList.toggle('on', k === i);
      c.style.transform = k === i && dx ? `rotate(${dx / 40}deg)` : '';
    });
    dots.innerHTML = cs.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
    count.textContent = `${i + 1} / ${cs.length}`;
    prev.disabled = i === 0;
    next.disabled = i === cs.length - 1;
  }

  function setView(v, save) {
    tiles = v === 'tiles';
    grid.classList.toggle('tiles', tiles);
    grid.parentElement.classList.toggle('tiles-on', tiles);
    nav.hidden = !tiles;
    document.querySelectorAll('[data-view]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.view === v)));
    const vt = document.querySelector('.view-toggle');
    if (vt) vt.dataset.active = v;
    if (!tiles) {
      grid.style.transform = '';
      grid.style.transition = '';
      grid.querySelectorAll('.card').forEach((c) => { c.classList.remove('on'); c.style.transform = ''; });
    }
    if (save) { try { localStorage.setItem('projView', v); } catch (e) {} }
    place(false);
  }

  const go = (d) => { i += d; dx = 0; place(); };

  document.querySelectorAll('[data-view]').forEach((c) => c.addEventListener('click', () => setView(c.dataset.view, true)));
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  dots.addEventListener('click', (e) => {
    const k = [...dots.children].indexOf(e.target);
    if (k > -1) { i = k; dx = 0; place(); }
  });
  document.addEventListener('keydown', (e) => {
    if (!tiles) return;
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });

  grid.addEventListener('pointerdown', (e) => {
    if (!tiles) return;
    startX = e.clientX; startY = e.clientY; dx = 0; dy = 0; moved = false; axis = null;
  });
  window.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    const mx = e.clientX - startX, my = e.clientY - startY;
    if (!axis && Math.hypot(mx, my) > 8) {
      const cur = cards()[i];
      const onCur = !!e.target.closest && e.target.closest('.card') === cur;
      axis = (e.pointerType === 'touch' && my < 0 && Math.abs(my) > Math.abs(mx) && onCur && linkOf(cur)) ? 'v' : 'h';
    }
    if (axis === 'v') {
      moved = true;
      dy = Math.min(0, my);
      const p = Math.min(1, -dy / SWIPE);
      const cur = cards()[i];
      grid.classList.add('dragging');
      cur.style.transform = `translateY(${dy}px) scale(${1 - p * 0.05})`;
      cur.classList.toggle('lifting', p >= 0.5);
      msg.classList.toggle('show', p >= 0.5);
      return;
    }
    dx = mx;
    if (Math.abs(dx) > 6) moved = true;
    const last = cards().length - 1;
    if ((i === 0 && dx > 0) || (i === last && dx < 0)) dx /= 3;
    grid.classList.add('dragging');
    place(false);
  });
  const release = (e) => {
    if (startX === null) return;
    if (axis === 'v') {
      const cur = cards()[i];
      const go = e && e.type === 'pointerup' && -dy / SWIPE >= 0.5;
      startX = null; axis = null;
      grid.classList.remove('dragging');
      msg.classList.remove('show');
      if (go) {
        cur.style.transition = 'transform .5s cubic-bezier(.6,0,.2,1), opacity .5s';
        cur.style.transform = 'translateY(-70vh) scale(.88)';
        cur.style.opacity = '0';
        goToDetails(cur, 'swipe');
      } else {
        cur.classList.remove('lifting');
        dy = 0;
        place();
      }
      return;
    }
    const d = dx;
    startX = null;
    grid.classList.remove('dragging');
    dx = 0;
    if (Math.abs(d) > 70) i += d < 0 ? 1 : -1;
    place();
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);

  grid.addEventListener('click', (e) => {
    if (!tiles) return;
    if (moved) { e.preventDefault(); return; }
    const k = cards().indexOf(e.target.closest('.card'));
    if (k > -1 && k !== i) { e.preventDefault(); i = k; place(); }
  });

  window.projTilesRefresh = (reset) => { if (reset) i = 0; place(); };
  window.addEventListener('resize', () => place(false));

  let saved = null;
  try { saved = localStorage.getItem('projView'); } catch (e) {}
  setView(saved || (window.matchMedia('(max-width: 760px)').matches ? 'tiles' : 'list'), false);

  // sort by when the project started
  const all = [...grid.querySelectorAll('.card')];
  all.forEach((c, n) => { c.dataset.order = n; });
  function applySort(mode, save) {
    const key = (c) => Number(c.dataset.start || 0);
    const list = [...all].sort((x, y) => {
      if (mode === 'newest') return key(y) - key(x) || x.dataset.order - y.dataset.order;
      if (mode === 'oldest') return key(x) - key(y) || x.dataset.order - y.dataset.order;
      return x.dataset.order - y.dataset.order;
    });
    list.forEach((c) => grid.appendChild(c));
    const sel = document.getElementById('sortSelect');
    if (sel) sel.value = mode;
    if (save) { try { localStorage.setItem('projSort', mode); } catch (e) {} }
    i = 0; dx = 0;
    place(false);
  }
  const sortSel = document.getElementById('sortSelect');
  if (sortSel) sortSel.addEventListener('change', () => applySort(sortSel.value, true));
  let savedSort = 'default';
  try { savedSort = localStorage.getItem('projSort') || 'default'; } catch (e) {}
  if (savedSort !== 'default') applySort(savedSort, false);

  // remember where the visitor was, so coming back from a details page lands on the same tile
  window.projSaveState = (slug) => {
    const fsel = document.getElementById('filterSelect');
    try {
      sessionStorage.setItem('projState', JSON.stringify({ view: tiles ? 'tiles' : 'list', filter: fsel ? fsel.value : 'all', slug, y: window.scrollY, t: Date.now() }));
    } catch (e) {}
  };
  let st = null;
  try { st = JSON.parse(sessionStorage.getItem('projState')); sessionStorage.removeItem('projState'); } catch (e) {}
  if (st && Date.now() - st.t < 30 * 60 * 1000) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (st.filter && st.filter !== 'all') applyFilter(st.filter);
    setView(st.view, false);
    const k = cards().findIndex((c) => { const l = linkOf(c); return l && l.getAttribute('href') === st.slug; });
    if (k > -1) { i = k; place(false); }
    requestAnimationFrame(() => window.scrollTo(0, st.y));
    setTimeout(() => window.scrollTo(0, st.y), 120);
  }
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    try { sessionStorage.removeItem('projState'); } catch (err) {}
    grid.querySelectorAll('.card').forEach((c) => { c.style.opacity = ''; c.style.transition = ''; c.classList.remove('lifting'); });
    place(false);
  });
})();

// Cards open their details page with a smooth wipe
function goToDetails(card, how) {
  const link = card && card.querySelector('.card-link');
  if (!link || document.body.classList.contains('leaving')) return;
  document.body.classList.add('leaving');
  if (window.projSaveState) window.projSaveState(link.getAttribute('href'));
  const wipe = document.createElement('div');
  wipe.className = 'nav-wipe';
  wipe.innerHTML = '<span class="mono">Going to details…</span>';
  document.body.appendChild(wipe);
  if (how !== 'swipe') card.classList.add('launching');
  requestAnimationFrame(() => requestAnimationFrame(() => wipe.classList.add('on')));
  setTimeout(() => { location.href = link.getAttribute('href'); }, 520);
}
document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
  const a = e.target.closest('a.card-link');
  if (!a) return;
  e.preventDefault();
  goToDetails(a.closest('.card'), 'click');
});
window.addEventListener('pageshow', () => {
  document.body.classList.remove('leaving');
  document.querySelectorAll('.nav-wipe').forEach((w) => w.remove());
  document.querySelectorAll('.card.launching').forEach((c) => c.classList.remove('launching'));
});

// Project detail page: photo gallery
(() => {
  const gal = document.getElementById('gallery');
  if (!gal) return;
  const shots = [...gal.querySelectorAll('.shot')];
  const dots = gal.querySelector('.g-dots');
  const stage = gal.querySelector('.g-stage');
  let k = 0, sx = null;
  const STEP = 10;
  const prevBtn = gal.querySelector('.prev');
  const nextBtn = gal.querySelector('.next');
  const skip = document.createElement('div');
  skip.className = 'g-skip';
  skip.hidden = true;
  skip.innerHTML = '<button type="button" class="skip-prev">‹ previous item</button><button type="button" class="skip-next">next item ›</button>';
  (gal.querySelector('.g-cap') || dots).after(skip);
  dots.innerHTML = shots.map((_, i) => `<button type="button" role="tab" aria-label="Photo ${i + 1}"></button>`).join('');
  const show = (n) => {
    k = (n + shots.length) % shots.length;
    shots.forEach((s, i) => s.classList.toggle('on', i === k));
    [...dots.children].forEach((d, i) => d.setAttribute('aria-selected', String(i === k)));
    const cap = gal.querySelector('.g-cap');
    if (cap) cap.textContent = (shots[k].dataset.cap || '') + (shots.length > 6 ? `  ·  ${k + 1} / ${shots.length}` : '');
    shots.forEach((s, i) => { const v = s.querySelector('video'); if (v && i !== k) v.pause(); });
    // on a video slide the arrows rewind and fast-forward it; the skip row moves between items
    const isVideo = !!shots[k].querySelector('video');
    stage.classList.toggle('video-mode', isVideo);
    prevBtn.textContent = isVideo ? '⏪' : '←';
    nextBtn.textContent = isVideo ? '⏩' : '→';
    prevBtn.setAttribute('aria-label', isVideo ? 'Rewind 10 seconds' : 'Previous item');
    nextBtn.setAttribute('aria-label', isVideo ? 'Fast-forward 10 seconds' : 'Next item');
    skip.hidden = !isVideo;
  };
  const seek = (d) => {
    const v = shots[k].querySelector('video');
    if (!v) return false;
    v.currentTime = Math.max(0, Math.min(v.duration || 1e9, v.currentTime + d));
    return true;
  };
  prevBtn.addEventListener('click', () => { if (!seek(-STEP)) show(k - 1); });
  nextBtn.addEventListener('click', () => { if (!seek(STEP)) show(k + 1); });
  skip.querySelector('.skip-prev').addEventListener('click', () => show(k - 1));
  skip.querySelector('.skip-next').addEventListener('click', () => show(k + 1));
  dots.addEventListener('click', (e) => { const i = [...dots.children].indexOf(e.target); if (i > -1) show(i); });
  stage.addEventListener('pointerdown', (e) => { sx = e.target.closest('video') ? null : e.clientX; });
  stage.addEventListener('pointerup', (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 40) show(k + (e.clientX < sx ? 1 : -1)); sx = null; });
  gal.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && !seek(-STEP)) show(k - 1);
    if (e.key === 'ArrowRight' && !seek(STEP)) show(k + 1);
  });
  show(0);
})();

// Project detail page: clickable system parts
document.querySelectorAll('.arch').forEach((arch) => {
  arch.querySelectorAll('.node').forEach((node) => node.addEventListener('click', () => {
    arch.querySelectorAll('.node').forEach((n) => { n.classList.toggle('on', n === node); n.setAttribute('aria-pressed', String(n === node)); });
    arch.querySelectorAll('.arch-pane').forEach((p) => { const on = p.dataset.pane === node.dataset.node; p.hidden = !on; p.classList.toggle('on', on); });
  }));
});


// Project detail pages: previous and next project, in the order chosen on the projects page
(async () => {
  const back = document.querySelector('.back-link');
  if (!back || !document.querySelector('.pd-top')) return;
  const here = location.pathname.split('/').pop() || 'index.html';
  let items = [];
  try {
    const res = await fetch('projects.html');
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    items = [...doc.querySelectorAll('.card')].map((c, order) => {
      const link = c.querySelector('.card-link');
      return link ? { href: link.getAttribute('href'), title: c.querySelector('h3').textContent, start: Number(c.dataset.start || 0), order } : null;
    }).filter(Boolean);
  } catch (e) { return; }
  let mode = 'default';
  try { mode = localStorage.getItem('projSort') || 'default'; } catch (e) {}
  items.sort((a, b) => (mode === 'newest' ? b.start - a.start : mode === 'oldest' ? a.start - b.start : 0) || a.order - b.order);
  const i = items.findIndex((x) => x.href === here);
  if (i < 0 || items.length < 2) return;
  const prev = items[(i - 1 + items.length) % items.length];
  const next = items[(i + 1) % items.length];

  const bar = document.createElement('div');
  bar.className = 'pd-bar';
  back.replaceWith(bar);
  bar.appendChild(back);
  const nav = document.createElement('div');
  nav.className = 'pd-nav';
  nav.id = 'pdNav';
  nav.innerHTML = `<a href="${prev.href}" data-title="${prev.title}" aria-label="Previous project: ${prev.title}" title="Previous: ${prev.title}">←</a><span class="mono">${i + 1} / ${items.length}</span><a href="${next.href}" data-title="${next.title}" aria-label="Next project: ${next.title}" title="Next: ${next.title}">→</a>`;
  bar.appendChild(nav);

  const strip = document.querySelector('.site-main .strip');
  if (strip) {
    const pager = document.createElement('nav');
    pager.className = 'pd-pager';
    pager.setAttribute('aria-label', 'More projects');
    pager.innerHTML = `<a class="pd-prev" href="${prev.href}" data-title="${prev.title}"><span class="mono">← previous project</span><b>${prev.title}</b></a><a class="pd-next" href="${next.href}" data-title="${next.title}"><span class="mono">next project →</span><b>${next.title}</b></a>`;
    strip.before(pager);
  }

  // same wipe as the project tiles
  document.querySelectorAll('.pd-nav a, .pd-pager a').forEach((a) => a.addEventListener('click', (e) => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || document.body.classList.contains('leaving')) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    const wipe = document.createElement('div');
    wipe.className = 'nav-wipe';
    wipe.innerHTML = '<span class="mono"></span>';
    wipe.firstChild.textContent = a.dataset.title + '…';
    document.body.appendChild(wipe);
    requestAnimationFrame(() => requestAnimationFrame(() => wipe.classList.add('on')));
    setTimeout(() => { location.href = a.getAttribute('href'); }, 480);
  }));
})();
