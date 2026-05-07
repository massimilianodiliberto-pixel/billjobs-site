'use strict';

/* ── Portfolio filter ──────────────────────────────────────── */
const filterBtns = document.querySelectorAll('.filter__btn');
const portfolioItems = document.querySelectorAll('.portfolio__item');

if (filterBtns.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      portfolioItems.forEach(item => {
        const match = filter === 'all' || item.dataset.cat === filter;
        item.classList.toggle('hidden', !match);
      });
    });
  });

  // Read ?cat= from URL on load
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (cat) {
    const target = document.querySelector(`.filter__btn[data-filter="${cat}"]`);
    if (target) target.click();
  }
}

/* ── Showreel tab switcher ─────────────────────────────────── */
const showreelTabs = document.querySelectorAll('.showreel__tab');
const showreelIframe = document.getElementById('showreelIframe');

if (showreelTabs.length && showreelIframe) {
  showreelTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      showreelTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const videoId = tab.dataset.video;
      showreelIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    });
  });
}

/* ── Work item click navigation ────────────────────────────── */
document.querySelectorAll('.work__item[data-href]').forEach(item => {
  item.addEventListener('click', () => {
    window.location.href = item.dataset.href;
  });
  item.style.cursor = 'none';
});
