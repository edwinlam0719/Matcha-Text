// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "@firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDjdfD2b7Q6nBzbQheHVFzgbCtYbwHcAbU",
  authDomain: "matcha-text.firebaseapp.com",
  projectId: "matcha-text",
  storageBucket: "matcha-text.appspot.com",
  messagingSenderId: "630194542456",
  appId: "1:630194542456:web:3be475814533ce04299a8d",
  measurementId: "G-YQQJDP5WEQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);