// IndexedDB helper — supports large PDFs and high-DPI image pages
const dbHelper = {
  dbName: 'PartnerSignerDB_v3',
  dbVersion: 1,

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('templates')) {
          db.createObjectStore('templates');
        }
        if (!db.objectStoreNames.contains('submissions')) {
          db.createObjectStore('submissions', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror  = (e) => reject(e.target.error);
    });
  },

  async save(key, data) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction('templates', 'readwrite');
      const store   = tx.objectStore('templates');
      const request = store.put(data, key);
      request.onsuccess = () => resolve();
      request.onerror   = () => reject(request.error);
    });
  },

  async load(key) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction('templates', 'readonly');
      const store   = tx.objectStore('templates');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  },

  async saveSubmission(submission) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction('submissions', 'readwrite');
      const store   = tx.objectStore('submissions');
      const request = store.put(submission);
      request.onsuccess = () => resolve();
      request.onerror   = () => reject(request.error);
    });
  },

  async loadSubmission(id) {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx      = db.transaction('submissions', 'readonly');
      const store   = tx.objectStore('submissions');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }
};
