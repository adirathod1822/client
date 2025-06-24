import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD16lF3cKk-pViLq5-zc-PlEvlJkPjc-ps",
  authDomain: "onlychat-1f5ee.firebaseapp.com",
  projectId: "onlychat-1f5ee",
  storageBucket: "onlychat-1f5ee.firebasestorage.app",
  messagingSenderId: "557767544646",
  appId: "1:557767544646:web:fefd5bb40bff9d4f7d5f47",
  measurementId: "G-5X73W82BZG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();