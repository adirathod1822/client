import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBJjNBYnvJV_0shk3f2iOfqL_LuoKsv0B8",
  authDomain: "rex-chat-b6ef9.firebaseapp.com",
  projectId: "rex-chat-b6ef9",
  storageBucket: "rex-chat-b6ef9.firebasestorage.app",
  messagingSenderId: "150899280738",
  appId: "1:150899280738:web:8d27f99116a3fc64143a3b",
  measurementId: "G-R05VJ0R7WS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();