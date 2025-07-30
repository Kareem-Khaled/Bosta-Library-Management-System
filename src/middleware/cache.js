// Simple in-memory cache
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Create simple cache instance
const cache = new SimpleCache();

module.exports = {
  cache
};
