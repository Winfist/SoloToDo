import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDR7cm2PnhKY58k6NSKMq6JjdqAMUoAUjc",
  authDomain: "solo-todo.firebaseapp.com",
  projectId: "solo-todo",
  storageBucket: "solo-todo.firebasestorage.app",
  messagingSenderId: "528898647146",
  appId: "1:528898647146:web:66f34f35cc3ef944449613",
  measurementId: "G-RCBGS0F6N4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
