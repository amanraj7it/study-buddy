// Offline-tolerance storage helper for Education Chest
// Ensures low-connectivity students can always revise past doubts and study offline

const DOUBTS_CACHE_KEY = 'education_chest_cached_doubts';
const CIRCLES_CACHE_KEY = 'education_chest_cached_circles';
const OFFLINE_DRAFTS_KEY = 'education_chest_offline_drafts';

export const offlineStorage = {
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  cacheDoubts(doubts) {
    try {
      if (Array.isArray(doubts)) {
        localStorage.setItem(DOUBTS_CACHE_KEY, JSON.stringify(doubts));
      }
    } catch (e) {
      console.warn('Could not cache doubts to localStorage:', e);
    }
  },

  getCachedDoubts() {
    try {
      const raw = localStorage.getItem(DOUBTS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  cacheCircles(circles) {
    try {
      if (Array.isArray(circles)) {
        localStorage.setItem(CIRCLES_CACHE_KEY, JSON.stringify(circles));
      }
    } catch (e) {
      console.warn('Could not cache circles:', e);
    }
  },

  getCachedCircles() {
    try {
      const raw = localStorage.getItem(CIRCLES_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveOfflineDoubtDraft(draft) {
    try {
      const existing = this.getOfflineDoubtDrafts();
      const updated = [{ ...draft, id: `offline_${Date.now()}`, createdAt: new Date().toISOString() }, ...existing];
      localStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return [];
    }
  },

  getOfflineDoubtDrafts() {
    try {
      const raw = localStorage.getItem(OFFLINE_DRAFTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
};
