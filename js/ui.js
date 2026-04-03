/* ===== UI Rendering ===== */
const UI = (() => {
  function renderPaperList(paginatedData, searchQuery) {
    const container = document.getElementById('paperList');
    if (!container) return;

    const { papers, total, page, totalPages } = paginatedData;

    // Update paper count
    const countEl = document.getElementById('paperCount');
    if (countEl) countEl.textContent = I18n.t('paperCount', { count: total });

    if (papers.length === 0) {
      container.innerHTML = renderNoResults();
      renderPagination(0, 1, 1);
      return;
    }

    container.innerHTML = papers.map(p => renderPaperCard(p, searchQuery)).join('');
    renderPagination(total, page, totalPages);
    bindCardEvents(container);
  }

  function renderPaperCard(paper, searchQuery) {
    const title = searchQuery ? Search.highlightText(escapeHtml(paper.title), searchQuery) : escapeHtml(paper.title);
    const authorsDisplay = formatAuthors(paper.authors);
    const abstractPreview = paper.abstract ? truncate(paper.abstract, 200) : '';
    const abstractFull = paper.abstract || '';
    const isShort = abstractFull.length <= 200;
    const bookmarkClass = paper.bookmarked ? 'active' : '';

    const topicTags = (paper.topics || []).map(t =>
      `<span class="tag tag-${t}">${I18n.t(t)}</span>`
    ).join('');

    const sourceBadge = paper.isPreprint
      ? `<span class="tag tag-preprint">${I18n.t('preprint')}</span>`
      : `<span class="tag tag-source">${escapeHtml(paper.source)}</span>`;

    return `
      <div class="paper-card" data-id="${paper.id}">
        <div class="paper-card-header">
          <div class="paper-title">
            <a href="${escapeHtml(paper.url)}" target="_blank" rel="noopener">${title}</a>
          </div>
          <button class="btn-bookmark ${bookmarkClass}" data-id="${paper.id}" title="Bookmark">
            ${paper.bookmarked ? '\u2605' : '\u2606'}
          </button>
        </div>
        <div class="paper-meta">
          <span class="paper-meta-item">${escapeHtml(authorsDisplay)}</span>
          <span class="paper-meta-item"><strong>${escapeHtml(paper.journal)}</strong></span>
          <span class="paper-meta-item">${escapeHtml(paper.date)}</span>
        </div>
        ${abstractPreview ? `
          <div class="paper-abstract">
            <span class="abstract-short">${searchQuery ? Search.highlightText(escapeHtml(abstractPreview), searchQuery) : escapeHtml(abstractPreview)}</span>
            ${!isShort ? `<span class="abstract-full" style="display:none">${searchQuery ? Search.highlightText(escapeHtml(abstractFull), searchQuery) : escapeHtml(abstractFull)}</span>` : ''}
            ${!isShort ? `<button class="paper-abstract-toggle" data-expanded="false">${I18n.t('showMore')}</button>` : ''}
          </div>
        ` : ''}
        <div class="paper-tags">
          ${topicTags}
          ${sourceBadge}
        </div>
      </div>
    `;
  }

  function renderBookmarkList() {
    const container = document.getElementById('bookmarkList');
    if (!container) return;

    const bookmarks = Bookmarks.getAll();
    if (bookmarks.length === 0) {
      container.innerHTML = renderNoResults(I18n.t('noBookmarks'));
      return;
    }

    container.innerHTML = bookmarks.map(p => {
      p.bookmarked = true;
      return renderPaperCard(p, '');
    }).join('');
    bindCardEvents(container);
  }

  function bindCardEvents(container) {
    // Bookmark buttons
    container.querySelectorAll('.btn-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const allPapers = Papers.getAll();
        let paper = allPapers.find(p => p.id === id);
        if (!paper) {
          // Check bookmarks
          paper = Bookmarks.getAll().find(b => b.id === id);
        }
        if (!paper) return;

        const added = Bookmarks.toggle(paper);
        if (added === false) {
          btn.classList.remove('active');
          btn.textContent = '\u2606';
          showToast(I18n.t('bookmarkRemoved'), 'info');
        } else {
          btn.classList.add('active');
          btn.textContent = '\u2605';
          showToast(I18n.t('bookmarkAdded'), 'success');
        }
      });
    });

    // Abstract toggle
    container.querySelectorAll('.paper-abstract-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const abstractDiv = btn.closest('.paper-abstract');
        const shortEl = abstractDiv.querySelector('.abstract-short');
        const fullEl = abstractDiv.querySelector('.abstract-full');
        const expanded = btn.dataset.expanded === 'true';

        if (expanded) {
          shortEl.style.display = '';
          if (fullEl) fullEl.style.display = 'none';
          btn.textContent = I18n.t('showMore');
          btn.dataset.expanded = 'false';
        } else {
          shortEl.style.display = 'none';
          if (fullEl) fullEl.style.display = '';
          btn.textContent = I18n.t('showLess');
          btn.dataset.expanded = 'true';
        }
      });
    });
  }

  function renderPagination(total, currentPage, totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>${I18n.t('prev')}</button>`;

    const pages = getPageNumbers(currentPage, totalPages);
    pages.forEach(p => {
      if (p === '...') {
        html += `<span style="padding:0 4px;color:var(--text-muted)">...</span>`;
      } else {
        html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
    });

    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>${I18n.t('next')}</button>`;

    container.innerHTML = html;

    container.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page >= 1 && page <= totalPages) {
          Filters.setPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  function renderNoResults(message) {
    return `
      <div class="no-results">
        <div class="no-results-icon">&#128269;</div>
        <div class="no-results-text">${message || I18n.t('noResults')}</div>
      </div>
    `;
  }

  function renderSkeletons(count) {
    const container = document.getElementById('paperList');
    if (!container) return;
    container.innerHTML = Array.from({ length: count }, () =>
      '<div class="skeleton skeleton-card"></div>'
    ).join('');
  }

  function updateJournalFilter(journals) {
    const select = document.getElementById('journalFilter');
    if (!select) return;
    const currentVal = select.value;
    select.innerHTML = `<option value="">${I18n.t('allJournals')}</option>`;
    journals.forEach(j => {
      const opt = document.createElement('option');
      opt.value = j;
      opt.textContent = j;
      if (j === currentVal) opt.selected = true;
      select.appendChild(opt);
    });
  }

  function updateLastUpdated() {
    const el = document.getElementById('lastUpdated');
    if (!el) return;
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    el.textContent = I18n.t('lastUpdated', { time });
  }

  function showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (el) el.classList.toggle('active', show);
  }

  function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(16px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Helpers
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function truncate(str, len) {
    if (str.length <= len) return str;
    return str.slice(0, len) + '...';
  }

  function formatAuthors(authors) {
    if (!authors || authors.length === 0) return '';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')} et al.`;
  }

  return {
    renderPaperList, renderBookmarkList, renderSkeletons,
    updateJournalFilter, updateLastUpdated, showLoading, showToast, escapeHtml
  };
})();
