// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCk3v62Pnd5McivPIohkWuE5vAQ-q40L-o",
  authDomain: "hopeweb-ad3cc.firebaseapp.com",
  projectId: "hopeweb-ad3cc",
  storageBucket: "hopeweb-ad3cc.firebasestorage.app",
  messagingSenderId: "923820133734",
  appId: "1:923820133734:web:8606393d44cab05c3fcca7",
  measurementId: "G-6XNQH5PT6M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
