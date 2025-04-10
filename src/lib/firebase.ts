
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCW98RxxL-hBShVTIg1_DhcM34Y2f7opvE",
  authDomain: "myschool-official.firebaseapp.com",
  projectId: "myschool-official",
  storageBucket: "myschool-official.firebasestorage.app",
  messagingSenderId: "785743603281",
  appId: "1:785743603281:web:ea8c845ddd056109a37a70"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
