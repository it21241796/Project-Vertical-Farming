import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBMYPSlfQHMZNaLXnYuRZI2ts6cMnAg3aA",
  authDomain: "vertical-farming-23a46.firebaseapp.com",
  projectId: "vertical-farming-23a46",
  storageBucket: "vertical-farming-23a46.firebasestorage.app",
  messagingSenderId: "126090357763",
  appId: "1:126090357763:web:aee320fb4608881857f236"
};
 
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };