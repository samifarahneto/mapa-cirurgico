// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXW3KTEQMsC_ohii2x0yX7luSlCr-N9oU",
  authDomain: "cirurgias-a6a25.firebaseapp.com",
  projectId: "cirurgias-a6a25",
  storageBucket: "cirurgias-a6a25.firebasestorage.app",
  messagingSenderId: "662750748696",
  appId: "1:662750748696:web:032d591e465c2f1511a36d",
  measurementId: "G-CE7G4EHTC3",
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

export { db };
