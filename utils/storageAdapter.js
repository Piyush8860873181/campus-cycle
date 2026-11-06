const fs = require('fs');
const path = require('path');
const { categoriesData, getSeedUsers, getSeedProducts, getSeedOffers } = require('./seedData');

const dataDir = path.join(__dirname, '../data');
const storeFile = path.join(dataDir, 'campuscycle_store.json');

// In-memory cache synced with disk
let dbState = {
  users: [],
  categories: [],
  products: [],
  offers: [],
  conversations: [],
  messages: [],
  wishlists: [],
  reports: []
};

function ensureInitialized() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let needsSeed = false;

  if (fs.existsSync(storeFile)) {
    try {
      const content = fs.readFileSync(storeFile, 'utf8');
      dbState = JSON.parse(content);
      if (!dbState.products || dbState.products.length === 0) {
        needsSeed = true;
      }
    } catch (err) {
      console.error('[Storage] Error reading local store, resetting cache:', err.message);
      needsSeed = true;
    }
  } else {
    needsSeed = true;
  }

  if (needsSeed) {
    dbState.categories = categoriesData.map((cat, idx) => ({
      _id: `cat_${idx + 1}`,
      ...cat,
      itemCount: 0
    }));
    dbState.users = getSeedUsers();
    dbState.products = getSeedProducts();
    dbState.offers = getSeedOffers();
    dbState.conversations = [
      {
        _id: 'conv_001',
        participants: ['user_priya_003', 'user_aarav_002'],
        product: 'prod_001',
        lastMessage: 'Hey Aarav, can we do ₹720? I can meet you at North Campus Metro today!',
        lastMessageTime: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];
    dbState.messages = [
      {
        _id: 'msg_001',
        conversation: 'conv_001',
        sender: 'user_priya_003',
        recipient: 'user_aarav_002',
        content: 'Hi Aarav! Is the Casio ClassWiz calculator still available?',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        _id: 'msg_002',
        conversation: 'conv_001',
        sender: 'user_aarav_002',
        recipient: 'user_priya_003',
        content: 'Hey Priya, yes it is! Barely used it for one semester.',
        read: true,
        createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString()
      },
      {
        _id: 'msg_003',
        conversation: 'conv_001',
        sender: 'user_priya_003',
        recipient: 'user_aarav_002',
        content: 'Hey Aarav, can we do ₹720? I can meet you at North Campus Metro today!',
        offer: 'offer_001',
        read: false,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];
    dbState.wishlists = [
      {
        _id: 'wish_001',
        user: 'user_priya_003',
        product: 'prod_009',
        createdAt: new Date().toISOString()
      }
    ];
    dbState.reports = [];
    
    // update category item counts
    dbState.categories.forEach(cat => {
      cat.itemCount = dbState.products.filter(p => p.category === cat.name).length;
    });

    persist();
    console.log('[Storage] Initialized and seeded CampusCycle local data store with rich demo listings.');
  }
}

function persist() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(storeFile, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (err) {
    console.error('[Storage] Error persisting to store file:', err.message);
  }
}

ensureInitialized();

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

module.exports = {
  dbState,
  persist,
  generateId,
  ensureInitialized,
  
  // Generic collection operations
  getCollection: (name) => {
    if (!dbState[name]) dbState[name] = [];
    return dbState[name];
  },

  findById: (name, id) => {
    if (!dbState[name]) return null;
    return dbState[name].find(item => item._id === id || item.id === id) || null;
  },

  findOne: (name, predicate) => {
    if (!dbState[name]) return null;
    return dbState[name].find(predicate) || null;
  },

  find: (name, predicate) => {
    if (!dbState[name]) return [];
    if (!predicate) return [...dbState[name]];
    return dbState[name].filter(predicate);
  },

  insert: (name, doc) => {
    if (!dbState[name]) dbState[name] = [];
    const newDoc = {
      _id: doc._id || generateId(),
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dbState[name].unshift(newDoc);
    persist();
    return newDoc;
  },

  updateById: (name, id, updateObj) => {
    if (!dbState[name]) return null;
    const index = dbState[name].findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    dbState[name][index] = {
      ...dbState[name][index],
      ...updateObj,
      updatedAt: new Date().toISOString()
    };
    persist();
    return dbState[name][index];
  },

  deleteById: (name, id) => {
    if (!dbState[name]) return false;
    const initialLen = dbState[name].length;
    dbState[name] = dbState[name].filter(item => item._id !== id && item.id !== id);
    const deleted = dbState[name].length < initialLen;
    if (deleted) persist();
    return deleted;
  }
};
