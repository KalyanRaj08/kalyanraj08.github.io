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
