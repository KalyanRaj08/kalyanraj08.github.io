// Projects page: filter chips
document.querySelectorAll('.chip[data-filter]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    document.querySelectorAll('.chip[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    document.querySelectorAll('.card[data-cat]').forEach((card) => {
      card.hidden = f !== 'all' && !card.dataset.cat.split(' ').includes(f);
    });
    if (window.projTilesRefresh) window.projTilesRefresh(true);
  });
});

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
  let tiles = false, i = 0, dx = 0, startX = null, moved = false;

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
    startX = e.clientX; dx = 0; moved = false;
  });
  window.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;
    const last = cards().length - 1;
    if ((i === 0 && dx > 0) || (i === last && dx < 0)) dx /= 3;
    grid.classList.add('dragging');
    place(false);
  });
  const release = () => {
    if (startX === null) return;
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
})();
