/* ===== Keyword Trends & Charts ===== */
const Trends = (() => {
  let chartDaily = null;
  let chartTopics = null;
  let chartKeywords = null;

  const TOPIC_COLORS = {
    nephrology: { bg: 'rgba(49, 130, 206, 0.7)', border: '#3182ce' },
    cardiology: { bg: 'rgba(229, 62, 62, 0.7)', border: '#e53e3e' },
    endocrinology: { bg: 'rgba(56, 161, 105, 0.7)', border: '#38a169' },
    general: { bg: 'rgba(128, 90, 213, 0.7)', border: '#805ad5' }
  };

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function getGridColor() {
    return isDark() ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  }

  function getTextColor() {
    return isDark() ? '#a0aec0' : '#4a5568';
  }

  function updateAll(papers) {
    if (typeof Chart === 'undefined') return;
    renderDailyChart(papers);
    renderTopicChart(papers);
    renderKeywordsChart(papers);
  }

  function renderDailyChart(papers) {
    const ctx = document.getElementById('chartDaily');
    if (!ctx) return;

    // Group by date
    const counts = {};
    papers.forEach(p => {
      if (p.date) {
        counts[p.date] = (counts[p.date] || 0) + 1;
      }
    });

    const dates = Object.keys(counts).sort();
    const values = dates.map(d => counts[d]);

    if (chartDaily) chartDaily.destroy();

    chartDaily = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(d => formatShortDate(d)),
        datasets: [{
          label: I18n.t('dailyPaperCount'),
          data: values,
          borderColor: '#3182ce',
          backgroundColor: 'rgba(49, 130, 206, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#3182ce'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: getGridColor() },
            ticks: { color: getTextColor(), maxRotation: 45 }
          },
          y: {
            beginAtZero: true,
            grid: { color: getGridColor() },
            ticks: { color: getTextColor(), stepSize: 1 }
          }
        }
      }
    });
  }

  function renderTopicChart(papers) {
    const ctx = document.getElementById('chartTopics');
    if (!ctx) return;

    const counts = { nephrology: 0, cardiology: 0, endocrinology: 0, general: 0 };
    papers.forEach(p => {
      (p.topics || []).forEach(t => {
        if (counts[t] !== undefined) counts[t]++;
      });
    });

    const labels = Object.keys(counts).map(k => I18n.t(k));
    const values = Object.values(counts);
    const colors = Object.keys(counts).map(k => TOPIC_COLORS[k].bg);
    const borders = Object.keys(counts).map(k => TOPIC_COLORS[k].border);

    if (chartTopics) chartTopics.destroy();

    chartTopics = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: getTextColor(), padding: 16, font: { size: 13 } }
          }
        }
      }
    });
  }

  function renderKeywordsChart(papers) {
    const ctx = document.getElementById('chartKeywords');
    if (!ctx) return;

    // Collect keywords
    const freq = {};
    const stopKeywords = new Set(['study', 'patients', 'results', 'methods', 'conclusion',
      'background', 'objective', 'conclusions', 'group', 'treatment', 'clinical',
      'analysis', 'associated', 'compared', 'significantly', 'effect', 'effects',
      'findings', 'research', 'data', 'outcome', 'outcomes', 'risk', 'total',
      'using', 'based', 'level', 'levels', 'high', 'higher', 'lower', 'increased']);

    papers.forEach(p => {
      (p.keywords || []).forEach(kw => {
        const k = kw.toLowerCase().trim();
        if (k.length > 2 && !stopKeywords.has(k)) {
          freq[k] = (freq[k] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);

    if (chartKeywords) chartKeywords.destroy();

    chartKeywords = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: I18n.t('topKeywords'),
          data: values,
          backgroundColor: 'rgba(49, 130, 206, 0.7)',
          borderColor: '#3182ce',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: getGridColor() },
            ticks: { color: getTextColor(), stepSize: 1 }
          },
          y: {
            grid: { display: false },
            ticks: { color: getTextColor(), font: { size: 12 } }
          }
        }
      }
    });
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
    return dateStr;
  }

  function destroyAll() {
    if (chartDaily) { chartDaily.destroy(); chartDaily = null; }
    if (chartTopics) { chartTopics.destroy(); chartTopics = null; }
    if (chartKeywords) { chartKeywords.destroy(); chartKeywords = null; }
  }

  return { updateAll, destroyAll };
})();
