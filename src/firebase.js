import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCgFGon_E_cbVvc9iEYI0KE1YiSOBZCofk",
  authDomain: "debugg2-930f5.firebaseapp.com",
  projectId: "debugg2-930f5",
  storageBucket: "debugg2-930f5.firebasestorage.app",
  messagingSenderId: "17553693728",
  appId: "1:17553693728:web:1fbc93cec672adf0173045",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
