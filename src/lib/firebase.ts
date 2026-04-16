import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBEcy0hfc77xxP8QX2tYLGZWBnZM2Sbn40",
  authDomain: "haoshijia.firebaseapp.com",
  projectId: "haoshijia",
  storageBucket: "haoshijia.firebasestorage.app",
  messagingSenderId: "666148687949",
  appId: "1:666148687949:web:e666e827961d1d80340c04",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);