import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, getDocFromServer } from 'firebase/firestore';

export const firebaseConfig = {
  projectId: "gen-lang-client-0887854619",
  appId: "1:156169722112:web:28f7758df104743a193be5",
  apiKey: "AIzaSyDJc5FxCWsHBfn7q1BKxMX7b6aTw_bdq8E",
  authDomain: "gen-lang-client-0887854619.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-mindsport-08285970-aa90-4800-b757-a006bf9b7ba9",
  storageBucket: "gen-lang-client-0887854619.firebasestorage.app",
  messagingSenderId: "156169722112",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { doc, getDoc, setDoc, onSnapshot, getDocFromServer };
