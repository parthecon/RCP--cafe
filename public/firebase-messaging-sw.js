// Import scripts for Firebase App and Messaging (v9 Compat version for Service Worker compat)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyC6stZ221xgXd047PqikMz4kdgjkKIao6c",
  authDomain: "rcp---cafe.firebaseapp.com",
  databaseURL: "https://rcp---cafe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rcp---cafe",
  storageBucket: "rcp---cafe.firebasestorage.app",
  messagingSenderId: "316216363848",
  appId: "1:316216363848:web:c8fb5a78af34ea46a6c17d"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Order Alert 🔔';
  const notificationOptions = {
    body: payload.notification?.body || 'A new order has been placed!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: payload.data?.orderId || 'new-order',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
