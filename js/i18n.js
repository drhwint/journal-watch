/* ===== Internationalization ===== */
const I18n = (() => {
  const strings = {
    ko: {
      appSubtitle: '의학 연구 논문 데일리 트래커',
      topic: '분야',
      nephrology: '신장학',
      cardiology: '심장학',
      endocrinology: '내분비학',
      journalGroup: '저널 그룹',
      general: '종합',
      source: '출처',
      period: '기간',
      journal: '저널',
      allJournals: '전체 저널',
      sort: '정렬',
      sortByDate: '최신순',
      sortByRelevance: '관련순',
      paperList: '논문 목록',
      trends: '키워드 트렌드',
      bookmarks: '북마크',
      searchPlaceholder: '검색어 입력...',
      loading: '논문을 불러오는 중...',
      noResults: '결과가 없습니다',
      paperCount: '총 {count}편',
      lastUpdated: '마지막 업데이트: {time}',
      showMore: '더보기',
      showLess: '접기',
      dailyPaperCount: '일별 논문 수',
      topicDistribution: '분야별 분포',
      topKeywords: '상위 키워드',
      exportJSON: 'JSON 내보내기',
      exportRIS: 'RIS 내보내기',
      refreshing: '새로고침 중...',
      refreshDone: '데이터를 업데이트했습니다',
      bookmarkAdded: '북마크에 추가했습니다',
      bookmarkRemoved: '북마크에서 제거했습니다',
      errorPubmed: 'PubMed 데이터를 불러올 수 없습니다',
      errorBiorxiv: 'bioRxiv 데이터를 불러올 수 없습니다',
      errorMedrxiv: 'medRxiv 데이터를 불러올 수 없습니다',
      retry: '재시도',
      preprint: '프리프린트',
      day1: '1일', day3: '3일', day7: '7일', day14: '14일', day30: '30일',
      prev: '이전',
      next: '다음',
      authors: '저자',
      noBookmarks: '북마크한 논문이 없습니다',
    },
    en: {
      appSubtitle: 'Daily Medical Research Paper Tracker',
      topic: 'Topic',
      nephrology: 'Nephrology',
      cardiology: 'Cardiology',
      endocrinology: 'Endocrinology',
      journalGroup: 'Journal Group',
      general: 'General',
      source: 'Source',
      period: 'Period',
      journal: 'Journal',
      allJournals: 'All Journals',
      sort: 'Sort',
      sortByDate: 'Newest',
      sortByRelevance: 'Relevance',
      paperList: 'Papers',
      trends: 'Trends',
      bookmarks: 'Bookmarks',
      searchPlaceholder: 'Search papers...',
      loading: 'Loading papers...',
      noResults: 'No results found',
      paperCount: '{count} papers',
      lastUpdated: 'Last updated: {time}',
      showMore: 'Show more',
      showLess: 'Show less',
      dailyPaperCount: 'Daily Paper Count',
      topicDistribution: 'Topic Distribution',
      topKeywords: 'Top Keywords',
      exportJSON: 'Export JSON',
      exportRIS: 'Export RIS',
      refreshing: 'Refreshing...',
      refreshDone: 'Data updated',
      bookmarkAdded: 'Bookmarked',
      bookmarkRemoved: 'Bookmark removed',
      errorPubmed: 'Failed to load PubMed data',
      errorBiorxiv: 'Failed to load bioRxiv data',
      errorMedrxiv: 'Failed to load medRxiv data',
      retry: 'Retry',
      preprint: 'Preprint',
      day1: '1 day', day3: '3 days', day7: '7 days', day14: '14 days', day30: '30 days',
      prev: 'Prev',
      next: 'Next',
      authors: 'Authors',
      noBookmarks: 'No bookmarked papers',
    }
  };

  let currentLang = 'ko';

  function t(key, params) {
    let str = (strings[currentLang] && strings[currentLang][key]) || strings.ko[key] || key;
    if (params) {
      Object.keys(params).forEach(k => {
        str = str.replace(`{${k}}`, params[k]);
      });
    }
    return str;
  }

  function setLanguage(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  function getLanguage() { return currentLang; }

  function toggle() {
    const next = currentLang === 'ko' ? 'en' : 'ko';
    setLanguage(next);
    return next;
  }

  return { t, setLanguage, getLanguage, toggle };
})();
