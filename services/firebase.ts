import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwXy4v4Xy_BhV5Trn1M6NBObt2MvuSKBY",
  authDomain: "a-plex.firebaseapp.com",
  projectId: "a-plex",
  storageBucket: "a-plex.firebasestorage.app",
  messagingSenderId: "503588689358",
  appId: "1:503588689358:web:3aedbfaf08d201bc77879f",
  measurementId: "G-GBZJQPT2LH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
