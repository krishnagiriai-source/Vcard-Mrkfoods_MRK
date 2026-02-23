// MRK Foods — Firebase Configuration
// Uses COMPAT syntax (required for CDN script tags in HTML)
// DO NOT use "import" statements here

const firebaseConfig = {
  apiKey:            "AIzaSyD4NCMkS53kABK1sJV9GLGaREUK5oj9TC8",
  authDomain:        "mrk-vcard.firebaseapp.com",
  projectId:         "mrk-vcard",
  storageBucket:     "mrk-vcard.firebasestorage.app",
  messagingSenderId: "1089819032689",
  appId:             "1:1089819032689:web:2ceb1d6035c11a61a2efd0"
};

// Initialize Firebase (compat style — works with CDN script tags)
firebase.initializeApp(firebaseConfig);
const db      = firebase.firestore();
const auth    = firebase.auth();
const storage = firebase.storage();
