/* ===== Application Bootstrap ===== */

/* --- Event Bus --- */
const EventBus = (() => {
  const listeners = {};
  function on(event, fn) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(fn);
  }
  function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
  }
  return { on, emit };
})();

/* --- App State --- */
const App = (() => {
  let currentTab = 'papers';
  let isLoading = false;

  async function init() {
    const settings = Cache.getRaw('settings') || {};
    if (settings.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    if (settings.lang) {
      I18n.setLanguage(settings.lang);
      updateLangButton();
    } else {
      I18n.setLanguage('ko');
    }

    // Set header date
    const headerDate = document.getElementById('headerDate');
    if (headerDate) {
      headerDate.textContent = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
      });
    }

    Cache.prune();
    Filters.init();
    bindEvents();

    UI.renderSkeletons(5);
    await loadData();
  }

  function bindEvents() {
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        currentTab = tab.dataset.tab;

        const contentId = {
          papers: 'tabPapers',
          trends: 'tabTrends',
          bookmarks: 'tabBookmarks'
        }[currentTab];

        document.getElementById(contentId)?.classList.add('active');

        if (currentTab === 'trends') {
          const filtered = Filters.applyFilters(Papers.getAll());
          Trends.updateAll(filtered);
        } else if (currentTab === 'bookmarks') {
          UI.renderBookmarkList();
        }
      });
    });

    // Refresh
    document.getElementById('btnRefresh')?.addEventListener('click', () => {
      Cache.clear();
      UI.showToast(I18n.t('refreshing'), 'info');
      loadData(true);
    });

    // Language toggle
    document.getElementById('btnLang')?.addEventListener('click', () => {
      const lang = I18n.toggle();
      updateLangButton();
      saveSettings({ lang });
      renderCurrentView();
    });

    // Dark mode toggle
    document.getElementById('btnDarkMode')?.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        saveSettings({ darkMode: false });
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        saveSettings({ darkMode: true });
      }
      if (currentTab === 'trends') {
        const filtered = Filters.applyFilters(Papers.getAll());
        Trends.updateAll(filtered);
      }
    });

    // Sidebar mobile
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.add('open');
      document.getElementById('sidebarOverlay')?.classList.add('active');
    });
    document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay')?.addEventListener('click', closeSidebar);

    // Export buttons
    document.getElementById('btnExportJSON')?.addEventListener('click', () => Bookmarks.exportJSON());
    document.getElementById('btnExportRIS')?.addEventListener('click', () => Bookmarks.exportRIS());

    // Event bus
    EventBus.on('filtersChanged', () => renderCurrentView());

    EventBus.on('dateRangeChanged', async () => {
      await loadData();
    });

    EventBus.on('groupsAdded', async (addedGroups) => {
      // Fetch data for newly checked groups and merge
      await loadData();
    });

    EventBus.on('bookmarksChanged', () => {
      const ids = Bookmarks.getIds();
      Papers.getAll().forEach(p => { p.bookmarked = ids.has(p.id); });
      if (currentTab === 'bookmarks') {
        UI.renderBookmarkList();
      }
    });

    EventBus.on('error', (err) => {
      UI.showToast(`Error loading data: ${err.topic || err.source}`, 'error');
    });

    // Visibility API
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const lastRefresh = Cache.getRaw('lastRefresh');
        if (!lastRefresh || Date.now() - lastRefresh > 12 * 60 * 60 * 1000) {
          loadData();
        }
      }
    });
  }

  async function loadData(forceRefresh) {
    if (isLoading) return;
    isLoading = true;
    UI.showLoading(true);

    const filterState = Filters.getState();
    const days = filterState.dateRange;

    try {
      const papers = await PubMedAPI.searchAll(filterState.groups, days);
      Papers.setAll(papers);
      UI.updateJournalFilter(Papers.getJournals());
      Cache.setDirect('lastRefresh', Date.now());
      UI.updateLastUpdated();
      renderCurrentView();

      if (forceRefresh) {
        UI.showToast(I18n.t('refreshDone'), 'success');
      }
    } catch (err) {
      console.error('Data load failed:', err);
      UI.showToast('Failed to load data. Please try refreshing.', 'error');
    } finally {
      isLoading = false;
      UI.showLoading(false);
    }
  }

  function renderCurrentView() {
    const allPapers = Papers.getAll();
    const filtered = Filters.applyFilters(allPapers);
    const filterState = Filters.getState();

    if (currentTab === 'papers') {
      const paginated = Filters.paginate(filtered);
      UI.renderPaperList(paginated, filterState.searchQuery);
    } else if (currentTab === 'trends') {
      Trends.updateAll(filtered);
    } else if (currentTab === 'bookmarks') {
      UI.renderBookmarkList();
    }
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.remove('active');
  }

  function updateLangButton() {
    const label = document.getElementById('langLabel');
    if (label) label.textContent = I18n.getLanguage() === 'ko' ? 'EN' : 'KR';
  }

  function saveSettings(partial) {
    const settings = Cache.getRaw('settings') || {};
    Object.assign(settings, partial);
    Cache.setDirect('settings', settings);
  }

  return { init };
})();

/* --- Start --- */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
