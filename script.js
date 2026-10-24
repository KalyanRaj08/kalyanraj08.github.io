// Projects page: filter chips
document.querySelectorAll('.chip[data-filter]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    document.querySelectorAll('.chip[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    document.querySelectorAll('.card[data-cat]').forEach((card) => {
      card.hidden = f !== 'all' && !card.dataset.cat.split(' ').includes(f);
    });
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
