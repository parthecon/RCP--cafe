import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if Firebase is configured (i.e. not using placeholders)
export const isFirebaseConfigured = 
  !!firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== '' && 
  !firebaseConfig.apiKey.includes('YOUR_') &&
  !!firebaseConfig.databaseURL &&
  !firebaseConfig.databaseURL.includes('YOUR_');

let app = null;
let auth = null;
let db = null;
let messaging = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    // Only initialize messaging in browser environment that supports ServiceWorkers
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        messaging = getMessaging(app);
      }
    } catch (msgErr) {
      console.warn("Firebase Messaging initialization skipped or unsupported:", msgErr);
    }
    console.log("Firebase initialized successfully in Realtime Database mode.");
  } catch (error) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", error);
  }
} else {
  console.log("Firebase credentials not configured or placeholder detected. Running in LocalStorage Mock Mode.");
}

export { app, auth, db, messaging };
export default firebaseConfig;
