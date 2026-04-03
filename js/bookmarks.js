/* ===== Bookmark Management ===== */
const Bookmarks = (() => {
  const KEY = 'bookmarks';
  const MAX = 500;

  function getAll() {
    return Cache.getRaw(KEY) || [];
  }

  function getIds() {
    return new Set(getAll().map(b => b.id));
  }

  function toggle(paper) {
    const bookmarks = getAll();
    const idx = bookmarks.findIndex(b => b.id === paper.id);
    let added;

    if (idx >= 0) {
      bookmarks.splice(idx, 1);
      added = false;
    } else {
      if (bookmarks.length >= MAX) {
        UI.showToast(I18n.t('bookmarkLimitReached') || `Bookmark limit reached (${MAX})`, 'error');
        return false;
      }
      // Store full paper data so bookmarks survive cache eviction
      bookmarks.unshift({
        id: paper.id,
        pmid: paper.pmid,
        doi: paper.doi,
        source: paper.source,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        date: paper.date,
        abstract: paper.abstract,
        keywords: paper.keywords,
        url: paper.url,
        topics: paper.topics,
        isPreprint: paper.isPreprint,
        bookmarkedAt: new Date().toISOString()
      });
      added = true;
    }

    Cache.setDirect(KEY, bookmarks);
    paper.bookmarked = added;
    EventBus.emit('bookmarksChanged');
    return added;
  }

  function isBookmarked(id) {
    return getIds().has(id);
  }

  function exportJSON() {
    const data = getAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `journal-watch-bookmarks-${formatDateForFile()}.json`);
  }

  function exportRIS() {
    const bookmarks = getAll();
    let ris = '';
    bookmarks.forEach(p => {
      ris += 'TY  - JOUR\n';
      if (p.title) ris += `TI  - ${p.title}\n`;
      (p.authors || []).forEach(a => { ris += `AU  - ${a}\n`; });
      if (p.journal) ris += `JO  - ${p.journal}\n`;
      if (p.date) ris += `DA  - ${p.date.replace(/-/g, '/')}\n`;
      if (p.doi) ris += `DO  - ${p.doi}\n`;
      if (p.abstract) ris += `AB  - ${p.abstract}\n`;
      if (p.url) ris += `UR  - ${p.url}\n`;
      (p.keywords || []).forEach(k => { ris += `KW  - ${k}\n`; });
      if (p.pmid) ris += `AN  - PMID:${p.pmid}\n`;
      ris += 'ER  - \n\n';
    });
    const blob = new Blob([ris], { type: 'application/x-research-info-systems' });
    downloadBlob(blob, `journal-watch-bookmarks-${formatDateForFile()}.ris`);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function formatDateForFile() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  return { getAll, getIds, toggle, isBookmarked, exportJSON, exportRIS };
})();
