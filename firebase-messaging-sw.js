// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.3.0/firebase-messaging-compat.js');

// Firebase configuration (same as main app)
const firebaseConfig = {
    apiKey: "AIzaSyCNl1eLCccchmMvUNf29EtTUbMn_FO_nuU",
    authDomain: "data-4e1c7.firebaseapp.com",
    projectId: "data-4e1c7",
    storageBucket: "data-4e1c7.firebasestorage.app",
    messagingSenderId: "844230746094",
    appId: "1:844230746094:web:7834ae9aaf29eccc3d38ff",
    measurementId: "G-L4ZQ1CL7T8"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || 'You have received a new message',
        icon: payload.notification?.icon || '/favicon.ico',
        badge: payload.notification?.badge || '/favicon.ico',
        tag: 'firebase-demo-notification',
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: {
            url: payload.fcmOptions?.link || '/',
            ...payload.data
        }
    };

    // Show the notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    
    event.notification.close();
    
    // Handle different actions
    if (event.action === 'dismiss') {
        return;
    }
    
    // Default action or 'open' action
    const urlToOpen = event.notification.data?.url || '/';
    
    // Open the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Check if app is already open
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // If app is not open, open it
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
    console.log('[firebase-messaging-sw.js] Service Worker activated');
});

// Handle service worker installation
self.addEventListener('install', function(event) {
    console.log('[firebase-messaging-sw.js] Service Worker installed');
    // Skip waiting to activate immediately
    self.skipWaiting();
});
