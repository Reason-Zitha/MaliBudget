
import { initializeApp, getApp, getApps } from
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAfbeoUjxIe2jJLf89BwPmdJVfqD2jh_QI",
  authDomain: "malibudget.firebaseapp.com",
  projectId: "malibudget",
  storageBucket: "malibudget.firebasestorage.app",
  messagingSenderId: "828431083173",
  appId: "1:828431083173:web:4dd6ed306e80b1b4560f4c",
  measurementId: "G-RW6FQ8VDGX"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
