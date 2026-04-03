/* ===== PubMed E-utilities API (Journal-based search) ===== */
const PubMedAPI = (() => {
  const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  const RATE_INTERVAL = 400;
  const MAX_RETRIES = 3;

  let lastRequestTime = 0;

  async function rateLimitedFetch(url, attempt) {
    attempt = attempt || 1;
    const now = Date.now();
    const wait = Math.max(0, RATE_INTERVAL - (now - lastRequestTime));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastRequestTime = Date.now();
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if ((res.status === 429 || res.status === 502) && attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, attempt * 2000));
          return rateLimitedFetch(url, attempt + 1);
        }
        throw new Error(`PubMed API error: ${res.status}`);
      }
      return res;
    } catch (err) {
      if (attempt < MAX_RETRIES && (err.message.includes('Failed to fetch') || err.name === 'TypeError')) {
        await new Promise(r => setTimeout(r, attempt * 1500));
        return rateLimitedFetch(url, attempt + 1);
      }
      throw err;
    }
  }

  // Journal groups with display names and PubMed journal abbreviations
  const JOURNAL_GROUPS = {
    nephrology: {
      label: '신장학',
      journals: [
        { abbr: 'J Am Soc Nephrol', name: 'JASN' },
        { abbr: 'Clin J Am Soc Nephrol', name: 'CJASN' },
        { abbr: 'Kidney Int', name: 'Kidney International' },
        { abbr: 'Kidney Med', name: 'Kidney Medicine' },
        { abbr: 'Am J Kidney Dis', name: 'AJKD' },
        { abbr: 'Nephrol Dial Transplant', name: 'NDT' },
        { abbr: 'Kidney Int Rep', name: 'Kidney Int Reports' },
        { abbr: 'Clin Kidney J', name: 'CKJ' },
        { abbr: 'Kidney Res Clin Pract', name: 'KRCP' },
        { abbr: 'Nat Rev Nephrol', name: 'Nat Rev Nephrol' },
        { abbr: 'Nephrology (Carlton)', name: 'Nephrology' },
        { abbr: 'J Nephrol', name: 'J Nephrol' },
        { abbr: 'Pediatr Nephrol', name: 'Pediatr Nephrol' },
      ]
    },
    cardiology: {
      label: '심장학',
      journals: [
        { abbr: 'Eur Heart J', name: 'European Heart Journal' },
        { abbr: 'J Am Coll Cardiol', name: 'JACC' },
        { abbr: 'Circulation', name: 'Circulation' },
        { abbr: 'Circ Res', name: 'Circ Research' },
        { abbr: 'JAMA Cardiol', name: 'JAMA Cardiology' },
        { abbr: 'Eur J Heart Fail', name: 'EHJ Heart Failure' },
        { abbr: 'Heart', name: 'Heart (BMJ)' },
        { abbr: 'J Heart Lung Transplant', name: 'JHLT' },
        { abbr: 'JACC Heart Fail', name: 'JACC HF' },
        { abbr: 'Nat Rev Cardiol', name: 'Nat Rev Cardiol' },
      ]
    },
    endocrinology: {
      label: '내분비학',
      journals: [
        { abbr: 'Diabetes Care', name: 'Diabetes Care' },
        { abbr: 'Lancet Diabetes Endocrinol', name: 'Lancet Diabetes' },
        { abbr: 'Diabetes', name: 'Diabetes' },
        { abbr: 'Diabetologia', name: 'Diabetologia' },
        { abbr: 'J Clin Endocrinol Metab', name: 'JCEM' },
        { abbr: 'Thyroid', name: 'Thyroid' },
        { abbr: 'Endocr Rev', name: 'Endocrine Reviews' },
        { abbr: 'Diabetes Obes Metab', name: 'Diabetes Obes Metab' },
        { abbr: 'Nat Rev Endocrinol', name: 'Nat Rev Endocrinol' },
      ]
    },
    general: {
      label: '종합',
      journals: [
        { abbr: 'N Engl J Med', name: 'NEJM' },
        { abbr: 'Lancet', name: 'Lancet' },
        { abbr: 'JAMA', name: 'JAMA' },
        { abbr: 'BMJ', name: 'BMJ' },
        { abbr: 'Ann Intern Med', name: 'Ann Intern Med' },
      ]
    }
  };

  function getJournalGroups() { return JOURNAL_GROUPS; }

  function getAllJournals() {
    const all = [];
    Object.entries(JOURNAL_GROUPS).forEach(([group, data]) => {
      data.journals.forEach(j => {
        all.push({ ...j, group, groupLabel: data.label });
      });
    });
    return all;
  }

  function formatDate(d) {
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }

  function buildJournalQuery(journalAbbrs) {
    // Build PubMed query: "journal1"[Journal] OR "journal2"[Journal]
    return journalAbbrs.map(j => `"${j}"[Journal]`).join(' OR ');
  }

  async function searchByGroup(group, days) {
    const cacheKey = `pubmed_${group}_${days}`;
    const cached = Cache.get(cacheKey);
    if (cached) return cached;

    const groupData = JOURNAL_GROUPS[group];
    if (!groupData) return [];

    const journalAbbrs = groupData.journals.map(j => j.abbr);
    const query = buildJournalQuery(journalAbbrs);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const searchUrl = `${BASE}/esearch.fcgi?db=pubmed&retmode=json&retmax=100&sort=date&datetype=edat&mindate=${formatDate(startDate)}&maxdate=${formatDate(endDate)}&term=${encodeURIComponent(query)}`;

    const searchRes = await rateLimitedFetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];

    if (ids.length === 0) return [];

    const summaries = await fetchSummaries(ids);
    const abstracts = await fetchAbstracts(ids);

    const papers = ids.map(id => {
      const summary = summaries[id];
      if (!summary) return null;
      const abstractData = abstracts.get(id) || { abstract: '', keywords: [] };
      return Papers.normalizePubMed(summary, abstractData, group);
    }).filter(Boolean);

    Cache.set(cacheKey, papers);
    return papers;
  }

  async function fetchSummaries(ids) {
    const chunks = [];
    for (let i = 0; i < ids.length; i += 100) {
      chunks.push(ids.slice(i, i + 100));
    }
    const results = {};
    for (const chunk of chunks) {
      const url = `${BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${chunk.join(',')}`;
      const res = await rateLimitedFetch(url);
      const data = await res.json();
      const docs = data.result || {};
      chunk.forEach(id => { if (docs[id]) results[id] = docs[id]; });
    }
    return results;
  }

  async function fetchAbstracts(ids) {
    const map = new Map();
    const chunks = [];
    for (let i = 0; i < ids.length; i += 100) {
      chunks.push(ids.slice(i, i + 100));
    }
    for (const chunk of chunks) {
      try {
        const url = `${BASE}/efetch.fcgi?db=pubmed&retmode=xml&rettype=abstract&id=${chunk.join(',')}`;
        const res = await rateLimitedFetch(url);
        const xmlText = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, 'text/xml');
        const articles = doc.querySelectorAll('PubmedArticle');

        articles.forEach(article => {
          const pmid = article.querySelector('PMID')?.textContent;
          if (!pmid) return;

          const abstractParts = article.querySelectorAll('AbstractText');
          let abstract = '';
          abstractParts.forEach(part => {
            const label = part.getAttribute('Label');
            if (label) abstract += `${label}: `;
            abstract += part.textContent + ' ';
          });

          const keywords = [];
          article.querySelectorAll('Keyword').forEach(kw => {
            keywords.push(kw.textContent.trim());
          });

          map.set(pmid, { abstract: abstract.trim(), keywords });
        });
      } catch {
        // Abstract fetch may fail; summaries still usable
      }
    }
    return map;
  }

  async function searchAll(groups, days) {
    const results = [];
    for (const group of groups) {
      try {
        const papers = await searchByGroup(group, days);
        results.push(...papers);
      } catch (err) {
        console.error(`PubMed search failed for ${group}:`, err);
        EventBus.emit('error', { source: 'pubmed', topic: group, error: err });
      }
    }
    return results;
  }

  return { searchByGroup, searchAll, getJournalGroups, getAllJournals };
})();
