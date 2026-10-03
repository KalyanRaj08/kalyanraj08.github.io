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
