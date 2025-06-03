// Simple in-memory cache for discovered texts
class TextCache {
  constructor() {
    this.cache = new Map();
    this.maxAge = 24 * 60 * 60 * 1000; // 24 hours
  }

  set(url, data) {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
  }

  get(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(url);
      return null;
    }
    
    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new TextCache();
