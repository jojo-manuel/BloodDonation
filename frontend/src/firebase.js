import { initializeApp } from "firebase/app";

// Keep your keys in env for production; this is fine for local/dev
export const firebaseConfig = {
  apiKey: "AIzaSyC7dl0bmpFP1Bu059jiSjRKLfQGIVWI7z0",
  authDomain: "hopeweb-f59cc.firebaseapp.com",
  projectId: "hopeweb-f59cc",
  storageBucket: "hopeweb-f59cc.firebasestorage.app",
  messagingSenderId: "815393238578",
  appId: "1:815393238578:web:4acf81fd497bacad8c962b",
  measurementId: "G-QWEZ3W25QX",
};

export const firebaseApp = initializeApp(firebaseConfig);