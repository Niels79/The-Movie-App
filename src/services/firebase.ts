// FILE: src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: 🔥 VERVANG DIT MET JOUW EIGEN FIREBASE CONFIGURATIE!
const firebaseConfig = {
  apiKey: "AIzaSyCEwt2zlgccmtWhtF5kk2Rp3n3zAbiYi3k",
  authDomain: "film-app-32dc5.firebaseapp.com",
  projectId: "film-app-32dc5",
  storageBucket: "film-app-32dc5.firebasestorage.app",
  messagingSenderId: "57349082200",
  appId: "1:57349082200:web:037e4a647296e129268e2d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();