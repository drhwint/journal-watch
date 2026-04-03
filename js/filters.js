/* ===== Filter State Management ===== */
const Filters = (() => {
  const state = {
    groups: ['nephrology', 'cardiology', 'endocrinology', 'general'],
    dateRange: 7,
    journal: '',
    sortBy: 'date',
    searchQuery: '',
    page: 1,
    pageSize: 20
  };

  function init() {
    restoreFromHash();

    // Bind journal group checkboxes
    document.querySelectorAll('input[name="group"]').forEach(el => {
      el.checked = state.groups.includes(el.value);
      el.addEventListener('change', () => {
        const newGroups = getCheckedValues('group');
        const addedGroups = newGroups.filter(g => !state.groups.includes(g));
        state.groups = newGroups;
        state.page = 1;
        if (addedGroups.length > 0) {
          EventBus.emit('groupsAdded', addedGroups);
        } else {
          apply();
        }
      });
    });

    const dateRange = document.getElementById('dateRange');
    if (dateRange) {
      dateRange.value = state.dateRange;
      dateRange.addEventListener('change', () => {
        const newRange = parseInt(dateRange.value);
        state.dateRange = newRange;
        state.page = 1;
        EventBus.emit('dateRangeChanged', newRange);
      });
    }

    const journalFilter = document.getElementById('journalFilter');
    if (journalFilter) {
      journalFilter.addEventListener('change', () => {
        state.journal = journalFilter.value;
        state.page = 1;
        apply();
      });
    }

    document.querySelectorAll('input[name="sort"]').forEach(el => {
      el.checked = el.value === state.sortBy;
      el.addEventListener('change', () => {
        state.sortBy = el.value;
        apply();
      });
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.value = state.searchQuery;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchQuery = searchInput.value.trim();
          state.page = 1;
          apply();
        }, 300);
      });
    }
  }

  function getCheckedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  }

  function apply() {
    syncToHash();
    EventBus.emit('filtersChanged', state);
  }

  function applyFilters(papers) {
    let filtered = papers;

    // Filter by group
    if (state.groups.length > 0) {
      filtered = filtered.filter(p =>
        p.topics.some(t => state.groups.includes(t))
      );
    }

    // Filter by date range
    if (state.dateRange) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - state.dateRange);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      filtered = filtered.filter(p => (p.date || '') >= cutoffStr);
    }

    // Filter by journal
    if (state.journal) {
      filtered = filtered.filter(p => p.journal === state.journal);
    }

    // Search
    if (state.searchQuery) {
      filtered = Search.search(filtered, state.searchQuery);
    } else if (state.sortBy === 'date') {
      filtered = Papers.sortByDate(filtered);
    }

    return filtered;
  }

  function paginate(papers) {
    const start = (state.page - 1) * state.pageSize;
    return {
      papers: papers.slice(start, start + state.pageSize),
      total: papers.length,
      page: state.page,
      totalPages: Math.ceil(papers.length / state.pageSize)
    };
  }

  function setPage(page) {
    state.page = page;
    apply();
  }

  function getState() { return { ...state }; }

  function syncToHash() {
    const params = new URLSearchParams();
    if (state.groups.length < 4) params.set('g', state.groups.join(','));
    if (state.dateRange !== 7) params.set('d', state.dateRange);
    if (state.journal) params.set('j', state.journal);
    if (state.sortBy !== 'date') params.set('sort', state.sortBy);
    if (state.searchQuery) params.set('q', state.searchQuery);
    if (state.page > 1) params.set('p', state.page);
    const hash = params.toString();
    history.replaceState(null, '', hash ? '#' + hash : window.location.pathname);
  }

  function restoreFromHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    if (params.has('g')) state.groups = params.get('g').split(',');
    if (params.has('d')) state.dateRange = parseInt(params.get('d')) || 7;
    if (params.has('j')) state.journal = params.get('j');
    if (params.has('sort')) state.sortBy = params.get('sort');
    if (params.has('q')) state.searchQuery = params.get('q');
    if (params.has('p')) state.page = parseInt(params.get('p')) || 1;
  }

  return { init, apply, applyFilters, paginate, setPage, getState };
})();
