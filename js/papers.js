/* ===== Paper Data Model ===== */
const Papers = (() => {
  let allPapers = [];

  function normalizePubMed(summary, abstractData, topic) {
    const authors = (summary.authors || []).map(a => a.name);
    const doi = (summary.elocationid || '').replace('doi: ', '').trim() || null;
    const pubDate = summary.pubdate || summary.sortpubdate || '';

    return {
      id: 'pm_' + summary.uid,
      pmid: summary.uid,
      source: 'pubmed',
      title: summary.title || '',
      authors,
      journal: summary.source || summary.fulljournalname || '',
      date: parseDate(pubDate),
      dateRaw: pubDate,
      abstract: abstractData.abstract || '',
      keywords: abstractData.keywords || [],
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${summary.uid}/`,
      doiUrl: doi ? `https://doi.org/${doi}` : null,
      topics: [topic],
      isPreprint: false,
      bookmarked: false
    };
  }

  function normalizeBiorxiv(item, topics, server) {
    const authors = (item.authors || '').split(';').map(a => a.trim()).filter(Boolean);
    return {
      id: 'bx_' + (item.doi || '').replace(/\//g, '_'),
      doi: item.doi || null,
      source: server,
      title: item.title || '',
      authors,
      journal: server === 'medrxiv' ? 'medRxiv' : 'bioRxiv',
      date: item.date || '',
      dateRaw: item.date || '',
      abstract: item.abstract || '',
      keywords: extractKeywordsFromText(item.title + ' ' + (item.abstract || '')),
      url: item.doi ? `https://doi.org/${item.doi}` : '#',
      topics,
      isPreprint: true,
      bookmarked: false
    };
  }

  function parseDate(dateStr) {
    if (!dateStr) return '';
    // PubMed dates: "2026 Apr 3", "2026 Apr", "2026"
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    // Try manual parse
    const parts = dateStr.split(/[\s/]+/);
    if (parts.length >= 1) return parts[0]; // at least year
    return dateStr;
  }

  function extractKeywordsFromText(text) {
    const stopwords = new Set(['the','a','an','and','or','of','in','to','for','with','on','at','by','from','is','was','are','were','be','been','has','have','had','this','that','these','those','it','its','we','our','their','than','not','no','but','as','can','may','will','do','did','which','what','who','how','all','each','both','more','most','other','some','such','only','very','also','into','over','after','about','between','through','during','before','under','without']);
    const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
    const freq = {};
    words.forEach(w => {
      if (w.length > 3 && !stopwords.has(w)) {
        freq[w] = (freq[w] || 0) + 1;
      }
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);
  }

  function deduplicateByDoi(papers) {
    const seen = new Map();
    const result = [];
    papers.forEach(p => {
      if (p.doi && seen.has(p.doi)) {
        // Merge topics
        const existing = seen.get(p.doi);
        p.topics.forEach(t => {
          if (!existing.topics.includes(t)) existing.topics.push(t);
        });
        // Prefer PubMed over preprints
        if (existing.isPreprint && !p.isPreprint) {
          Object.assign(existing, p, { topics: existing.topics });
        }
        return;
      }
      if (p.doi) seen.set(p.doi, p);
      result.push(p);
    });
    return result;
  }

  function sortByDate(papers) {
    return [...papers].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function setAll(papers) {
    allPapers = deduplicateByDoi(papers);
    // Update bookmark status
    const bookmarked = Bookmarks.getIds();
    allPapers.forEach(p => { p.bookmarked = bookmarked.has(p.id); });
    return allPapers;
  }

  function getAll() { return allPapers; }

  function getJournals() {
    const journals = new Set();
    allPapers.forEach(p => { if (p.journal) journals.add(p.journal); });
    return [...journals].sort();
  }

  return { normalizePubMed, normalizeBiorxiv, deduplicateByDoi, sortByDate, setAll, getAll, getJournals };
})();
