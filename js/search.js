/* ===== Client-Side Search ===== */
const Search = (() => {
  function search(papers, query) {
    if (!query || !query.trim()) return papers;

    const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return papers;

    const scored = papers.map(paper => {
      let score = 0;
      const titleLower = (paper.title || '').toLowerCase();
      const abstractLower = (paper.abstract || '').toLowerCase();
      const keywordsLower = (paper.keywords || []).join(' ').toLowerCase();
      const authorsLower = (paper.authors || []).join(' ').toLowerCase();
      const journalLower = (paper.journal || '').toLowerCase();

      tokens.forEach(token => {
        // Title matches (weight 3)
        if (titleLower.includes(token)) score += 3;
        // Keyword matches (weight 4)
        if (keywordsLower.includes(token)) score += 4;
        // Abstract matches (weight 2)
        if (abstractLower.includes(token)) score += 2;
        // Author matches (weight 1)
        if (authorsLower.includes(token)) score += 1;
        // Journal matches (weight 1)
        if (journalLower.includes(token)) score += 1;
      });

      return { paper, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(s => s.paper);
  }

  function highlightText(text, query) {
    if (!query || !text) return text;
    const tokens = query.split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return text;

    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  return { search, highlightText };
})();
