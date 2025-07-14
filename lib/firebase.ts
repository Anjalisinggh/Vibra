// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics"; // Optional

import { getAuth,signInWithEmailAndPassword } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCcbm1kYDI16SB26__o144uNDAeRu5E6S4",
  authDomain: "vibraa-4f904.firebaseapp.com",
  projectId: "vibraa-4f904",
  storageBucket: "vibraa-4f904.appspot.com", // ✅ fixed
  messagingSenderId: "229310784230",
  appId: "1:229310784230:web:e91876d856b7fd0e7b5127",
  measurementId: "G-HMSNVJ4TCW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Optional

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app;
