/* ===== localStorage Cache with TTL ===== */
const Cache = (() => {
  const TTL = 12 * 60 * 60 * 1000; // 12 hours
  const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
  const PREFIX = 'jw_';

  function set(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        prune();
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (_) { /* give up */ }
      }
    }
  }

  function get(key, maxAge) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      const age = maxAge || TTL;
      if (Date.now() - entry.timestamp > age) {
        localStorage.removeItem(PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  function getRaw(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw).data;
    } catch {
      return null;
    }
  }

  function remove(key) {
    localStorage.removeItem(PREFIX + key);
  }

  function setDirect(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ data: value, timestamp: Date.now() }));
    } catch { /* ignore */ }
  }

  function prune() {
    const now = Date.now();
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach(k => {
      try {
        const entry = JSON.parse(localStorage.getItem(k));
        if (entry && entry.timestamp && (now - entry.timestamp > MAX_AGE)) {
          localStorage.removeItem(k);
        }
      } catch {
        localStorage.removeItem(k);
      }
    });
  }

  function clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX) && k !== PREFIX + 'bookmarks' && k !== PREFIX + 'settings') {
        keys.push(k);
      }
    }
    keys.forEach(k => localStorage.removeItem(k));
  }

  return { set, get, getRaw, remove, setDirect, prune, clear };
})();
