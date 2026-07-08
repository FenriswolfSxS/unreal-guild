(function () {
  async function fetchJson(url) {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function loadHomeBubbles() {
    const grid = document.querySelector('[data-home-bubbles]');
    if (!grid) return;
    try {
      const data = await fetchJson('/api/content/home-bubbles');
      const bubbles = data.bubbles || [];
      if (!bubbles.length) return;
      grid.innerHTML = bubbles.map(b => `
        <article class="notice-card" data-bubble-id="${b.id}">
          <h2>${escapeHtml(b.title || '')}</h2>
          <p>${escapeHtml(b.body || '')}</p>
          ${b.button_label && b.button_link ? `<a href="${escapeAttr(b.button_link)}">${escapeHtml(b.button_label)} →</a>` : ''}
        </article>
      `).join('');
    } catch (_) {}
  }

  async function loadEditablePage() {
    const target = document.querySelector('[data-editable-page]');
    if (!target) return;
    const pageKey = target.dataset.editablePage;
    try {
      const data = await fetchJson('/api/content/page?page_key=' + encodeURIComponent(pageKey));
      if (data.page?.content_html) target.innerHTML = data.page.content_html;
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }
  function escapeAttr(value) { return escapeHtml(value).replace(/'/g, '&#39;'); }

  document.addEventListener('DOMContentLoaded', () => {
    loadHomeBubbles();
    loadEditablePage();
  });
})();
