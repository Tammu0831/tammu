import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZ5ihcVGJsLf_D0QTnumwRMqtPebsTbO8",
  authDomain: "tammu-36edb.firebaseapp.com",
  projectId: "tammu-36edb",
  storageBucket: "tammu-36edb.firebasestorage.app",
  messagingSenderId: "544125137830",
  appId: "1:544125137830:web:2baf51bf86c15354e59567",
  measurementId: "G-M9B23LWK96"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;