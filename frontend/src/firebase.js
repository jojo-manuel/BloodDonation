import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCk3v62Pnd5McivPIohkWuE5vAQ-q40L-o",
  authDomain: "hopeweb-f59cc.firebaseapp.com",
  projectId: "hopeweb-f59cc",
  storageBucket: "hopeweb-f59cc.appspot.com",
  messagingSenderId: "105148145440163808557",
  appId: "1:105148145440163808557:web:yourappid",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, analytics, auth, googleProvider };
