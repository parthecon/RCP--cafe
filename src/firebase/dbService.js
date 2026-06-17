import { auth as firebaseAuth, db as firebaseDb, isFirebaseConfigured } from './config';
import { DUMMY_MENU } from './dummyData';
import { sendOneSignalNotification } from '../utils/onesignal';
import { 
  ref, 
  onValue, 
  set, 
  push, 
  update, 
  remove, 
  get
} from 'firebase/database';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';

// Helper to generate short unique order ID
const generateOrderId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORDER-${result}`;
};

// --- LOCAL STORAGE MOCK DATABASE (Fallback) ---
const STORAGE_KEYS = {
  MENU: 'cafe_menu_items',
  ORDERS: 'cafe_orders',
  AUTH: 'cafe_admin_user',
  CATEGORIES: 'cafe_categories'
};

const DEFAULT_CATEGORIES = ['Food', 'Drinks', 'Snacks'];

// Initialize Local Categories if not present
const getLocalCategories = () => {
  const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }
  return JSON.parse(data);
};

const saveLocalCategories = (categories) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  notifyCategoriesListeners();
};

// Initialize Local Menu if not present
const getLocalMenu = () => {
  const data = localStorage.getItem(STORAGE_KEYS.MENU);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(DUMMY_MENU.map((item, index) => ({
      id: `menu_${index + 1}`,
      ...item,
      createdAt: Date.now()
    }))));
    return getLocalMenu();
  }
  return JSON.parse(data);
};

const saveLocalMenu = (menu) => {
  localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menu));
  notifyMenuListeners();
};

const getLocalOrders = () => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
};

const saveLocalOrders = (orders) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  notifyOrdersListeners();
};

// PubSub for Local Storage mode
const menuListeners = new Set();
const ordersListeners = new Set();
const authListeners = new Set();
const categoriesListeners = new Set();

const notifyMenuListeners = () => {
  const menu = getLocalMenu();
  menuListeners.forEach(cb => cb(menu));
};

const notifyOrdersListeners = () => {
  const orders = getLocalOrders();
  ordersListeners.forEach(cb => cb(orders));
};

const notifyAuthListeners = (user) => {
  authListeners.forEach(cb => cb(user));
};

const notifyCategoriesListeners = () => {
  const categories = getLocalCategories();
  categoriesListeners.forEach(cb => cb(categories));
};

// Sync across multiple tabs in LocalStorage mode
if (!isFirebaseConfigured) {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.MENU) {
      notifyMenuListeners();
    } else if (e.key === STORAGE_KEYS.ORDERS) {
      notifyOrdersListeners();
    } else if (e.key === STORAGE_KEYS.AUTH) {
      const user = e.newValue ? JSON.parse(e.newValue) : null;
      notifyAuthListeners(user);
    } else if (e.key === STORAGE_KEYS.CATEGORIES) {
      notifyCategoriesListeners();
    }
  });
}

// --- DATABASE SERVICE API ---

// 1. Menu CRUD operations
export const subscribeToMenu = (callback) => {
  if (isFirebaseConfigured) {
    const menuRef = ref(firebaseDb, 'menu');
    return onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // Seed menu with dummy data if database is empty
        const initialMenu = {};
        DUMMY_MENU.forEach((item, index) => {
          const id = `menu_${index + 1}`;
          initialMenu[id] = {
            ...item,
            createdAt: Date.now()
          };
        });
        set(menuRef, initialMenu);
        callback([]);
      } else {
        // Convert Firebase object to array with IDs
        const menuArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        callback(menuArray);
      }
    }, (error) => {
      console.error("Error subscribing to Firebase menu:", error);
    });
  } else {
    // LocalStorage fallback
    menuListeners.add(callback);
    callback(getLocalMenu());
    return () => {
      menuListeners.delete(callback);
    };
  }
};

export const saveMenuItem = async (item) => {
  if (isFirebaseConfigured) {
    const menuRef = ref(firebaseDb, 'menu');
    if (item.id) {
      // Update
      const itemRef = ref(firebaseDb, `menu/${item.id}`);
      const { id, ...data } = item;
      await set(itemRef, {
        ...data,
        updatedAt: Date.now()
      });
    } else {
      // Add
      const newItemRef = push(menuRef);
      await set(newItemRef, {
        ...item,
        createdAt: Date.now()
      });
    }
  } else {
    // LocalStorage fallback
    const menu = getLocalMenu();
    if (item.id) {
      const updatedMenu = menu.map(m => m.id === item.id ? { ...m, ...item, updatedAt: Date.now() } : m);
      saveLocalMenu(updatedMenu);
    } else {
      const newItem = {
        ...item,
        id: `menu_${Date.now()}`,
        createdAt: Date.now()
      };
      menu.push(newItem);
      saveLocalMenu(menu);
    }
  }
};

export const deleteMenuItem = async (id) => {
  if (isFirebaseConfigured) {
    const itemRef = ref(firebaseDb, `menu/${id}`);
    await remove(itemRef);
  } else {
    // LocalStorage fallback
    const menu = getLocalMenu();
    const updatedMenu = menu.filter(m => m.id !== id);
    saveLocalMenu(updatedMenu);
  }
};

export const toggleMenuItemAvailability = async (id, isAvailable) => {
  if (isFirebaseConfigured) {
    const itemRef = ref(firebaseDb, `menu/${id}`);
    await update(itemRef, { isAvailable });
  } else {
    // LocalStorage fallback
    const menu = getLocalMenu();
    const updatedMenu = menu.map(m => m.id === id ? { ...m, isAvailable } : m);
    saveLocalMenu(updatedMenu);
  }
};

// Helper to encode strings to be safe Firebase keys (escapes . # $ / [ ])
const encodeFirebaseKey = (key) => {
  return key
    .replace(/%/g, '%25')
    .replace(/\./g, '%2E')
    .replace(/#/g, '%23')
    .replace(/\$/g, '%24')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/\//g, '%2F');
};

const decodeFirebaseKey = (key) => {
  try {
    return decodeURIComponent(key);
  } catch (e) {
    return key;
  }
};

// 1b. Category CRUD operations
// NOTE: Firebase RTDB doesn't store true JS arrays — we use a plain object
// with category names as keys (e.g. { Food: true, Drinks: true }) so reads
// and writes are always consistent across SDK versions.
const parseCategoriesSnapshot = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(Boolean); // legacy fallback
  if (typeof data === 'object') return Object.keys(data).filter(k => data[k]).map(decodeFirebaseKey);
  return [];
};

export const subscribeToCategories = (callback) => {
  if (isFirebaseConfigured) {
    const categoriesRef = ref(firebaseDb, 'categories');
    return onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        // Seed default categories as keyed object
        const seed = {};
        DEFAULT_CATEGORIES.forEach(c => { seed[encodeFirebaseKey(c)] = true; });
        set(categoriesRef, seed);
        callback(DEFAULT_CATEGORIES);
      } else {
        callback(parseCategoriesSnapshot(data));
      }
    });
  } else {
    categoriesListeners.add(callback);
    callback(getLocalCategories());
    return () => {
      categoriesListeners.delete(callback);
    };
  }
};

export const saveCategory = async (categoryName) => {
  if (!categoryName || !categoryName.trim()) return;
  const newCat = categoryName.trim();

  if (isFirebaseConfigured) {
    // Write a single key — no need to read-modify-write the whole list
    const encodedCat = encodeFirebaseKey(newCat);
    const catKeyRef = ref(firebaseDb, `categories/${encodedCat}`);
    await set(catKeyRef, true);
  } else {
    const categories = getLocalCategories();
    if (!categories.includes(newCat)) {
      categories.push(newCat);
      saveLocalCategories(categories);
    }
  }
};

export const deleteCategory = async (categoryName) => {
  if (isFirebaseConfigured) {
    // Remove the single key
    const encodedCat = encodeFirebaseKey(categoryName);
    const catKeyRef = ref(firebaseDb, `categories/${encodedCat}`);
    await remove(catKeyRef);
  } else {
    const categories = getLocalCategories();
    const updated = categories.filter(c => c !== categoryName);
    saveLocalCategories(updated);
  }
};

// 2. Orders operations
export const subscribeToOrders = (callback) => {
  if (isFirebaseConfigured) {
    const ordersRef = ref(firebaseDb, 'orders');
    return onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
      } else {
        const ordersArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        callback(ordersArray);
      }
    });
  } else {
    ordersListeners.add(callback);
    callback(getLocalOrders());
    return () => {
      ordersListeners.delete(callback);
    };
  }
};

export const subscribeToOrder = (orderId, callback) => {
  if (isFirebaseConfigured) {
    const orderRef = ref(firebaseDb, `orders/${orderId}`);
    return onValue(orderRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback({ id: orderId, ...data });
      } else {
        callback(null);
      }
    });
  } else {
    const findAndNotify = () => {
      const orders = getLocalOrders();
      const order = orders.find(o => o.id === orderId);
      callback(order || null);
    };
    
    ordersListeners.add(findAndNotify);
    findAndNotify();
    return () => {
      ordersListeners.delete(findAndNotify);
    };
  }
};

export const createOrder = async (orderData) => {
  const orderId = generateOrderId();
  const newOrder = {
    customerName: orderData.customerName,
    tableNumber: orderData.tableNumber,
    items: orderData.items, // Array of { id, name, price, quantity }
    totalAmount: orderData.totalAmount,
    status: 'pending', // pending, preparing, done
    createdAt: Date.now()
  };

  if (isFirebaseConfigured) {
    const orderRef = ref(firebaseDb, `orders/${orderId}`);
    await set(orderRef, newOrder);
    // Send background push notification
    sendOrderPushNotification(orderId, orderData.tableNumber, orderData.totalAmount);
    return orderId;
  } else {
    const orders = getLocalOrders();
    orders.push({ id: orderId, ...newOrder });
    saveLocalOrders(orders);
    return orderId;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  if (isFirebaseConfigured) {
    const orderRef = ref(firebaseDb, `orders/${orderId}`);
    await update(orderRef, { status });
  } else {
    const orders = getLocalOrders();
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
    saveLocalOrders(updatedOrders);
  }
};

export const updateOrderItems = async (orderId, items, totalAmount) => {
  if (isFirebaseConfigured) {
    const orderRef = ref(firebaseDb, `orders/${orderId}`);
    await update(orderRef, { items, totalAmount, updatedAt: Date.now() });
  } else {
    const orders = getLocalOrders();
    const updatedOrders = orders.map(o =>
      o.id === orderId ? { ...o, items, totalAmount, updatedAt: Date.now() } : o
    );
    saveLocalOrders(updatedOrders);
  }
};

export const deleteOrder = async (orderId) => {
  if (isFirebaseConfigured) {
    const orderRef = ref(firebaseDb, `orders/${orderId}`);
    await remove(orderRef);
  } else {
    const orders = getLocalOrders();
    const updatedOrders = orders.filter(o => o.id !== orderId);
    saveLocalOrders(updatedOrders);
  }
};

// 3. Admin Authentication
export const signInAdmin = async (email, password) => {
  if (isFirebaseConfigured) {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return userCredential.user;
  } else {
    // Mock Authentication: check credentials
    if ((email === 'admin@rcp.com' && password === 'admin123') || (email === 'local@rcp.com' && password === 'local123')) {
      const mockUser = { email, uid: 'mock-admin-uid-123' };
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(mockUser));
      notifyAuthListeners(mockUser);
      return mockUser;
    } else {
      throw new Error("Invalid admin credentials. Use admin@rcp.com / admin123");
    }
  }
};

export const signOutAdmin = async () => {
  if (isFirebaseConfigured) {
    await firebaseSignOut(firebaseAuth);
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    notifyAuthListeners(null);
  }
};

export const subscribeToAuth = (callback) => {
  if (isFirebaseConfigured) {
    return onAuthStateChanged(firebaseAuth, callback);
  } else {
    authListeners.add(callback);
    const savedUser = localStorage.getItem(STORAGE_KEYS.AUTH);
    callback(savedUser ? JSON.parse(savedUser) : null);
    return () => {
      authListeners.delete(callback);
    };
  }
};

// 4. Background Push Notifications Token Management & Sending
export const saveAdminPushToken = async (token) => {
  if (isFirebaseConfigured) {
    const tokenRef = ref(firebaseDb, `admin_tokens/${token.replace(/[.#$/[\]]/g, '_')}`);
    await set(tokenRef, true);
  } else {
    const tokens = JSON.parse(localStorage.getItem('cafe_admin_tokens') || '[]');
    if (!tokens.includes(token)) {
      tokens.push(token);
      localStorage.setItem('cafe_admin_tokens', JSON.stringify(tokens));
    }
  }
};

export const sendOrderPushNotification = async (orderId, tableNumber, totalAmount) => {
  // 1. Try to send via OneSignal Web Push
  try {
    await sendOneSignalNotification(orderId, tableNumber, totalAmount);
  } catch (osErr) {
    console.error("OneSignal push notification failed:", osErr);
  }

  // 2. Try to send via Firebase Cloud Messaging if configured
  if (!isFirebaseConfigured) return;
  
  const serverKey = import.meta.env.VITE_FIREBASE_SERVER_KEY;
  if (!serverKey) return;
  
  try {
    const tokensSnapshot = await get(ref(firebaseDb, 'admin_tokens'));
    const tokensData = tokensSnapshot.val();
    if (!tokensData) return;
    
    const tokens = Object.keys(tokensData);
    if (tokens.length === 0) return;
    
    const payload = {
      registration_ids: tokens,
      notification: {
        title: `🔔 New Order #${orderId}!`,
        body: `Table ${tableNumber} has placed an order for Rs. ${totalAmount}`,
        click_action: `${window.location.origin}/admin/dashboard`,
        sound: 'default'
      },
      data: {
        orderId: orderId,
        tableNumber: String(tableNumber)
      }
    };
    
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`
      },
      body: JSON.stringify(payload)
    });
    console.log("FCM Push notification sent successfully.");
  } catch (error) {
    console.error("Error sending FCM push notification:", error);
  }
};
