import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyClvHax8zgktPuN6-lG_du9CowaDt3oowg",
  authDomain: "hopeweb-ad3cc-73a72.firebaseapp.com",
  projectId: "hopeweb-ad3cc-73a72",
  storageBucket: "hopeweb-ad3cc-73a72.firebasestorage.app",
  messagingSenderId: "477336246310",
  appId: "1:477336246310:web:84cb3cb9fd8c7fb265aee7",
  measurementId: "G-R3ZBXD92C2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
