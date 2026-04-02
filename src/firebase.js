import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDpMGbFIKpnlIF9YxB-Agmtc8OaN9yEuVQ",
  authDomain: "iwoka-515dc.firebaseapp.com",
  projectId: "iwoka-515dc",
  storageBucket: "iwoka-515dc.firebasestorage.app",
  messagingSenderId: "761427816763",
  appId: "1:761427816763:web:ddd0c230ce367cf056c71e",
  measurementId: "G-YZL7CQ966Q"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
