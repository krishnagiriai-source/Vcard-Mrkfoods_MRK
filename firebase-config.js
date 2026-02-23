// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4NCMkS53kABK1sJV9GLGaREUK5oj9TC8",
  authDomain: "mrk-vcard.firebaseapp.com",
  projectId: "mrk-vcard",
  storageBucket: "mrk-vcard.firebasestorage.app",
  messagingSenderId: "1089819032689",
  appId: "1:1089819032689:web:2ceb1d6035c11a61a2efd0",
  measurementId: "G-90101RJY4X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);