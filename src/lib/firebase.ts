import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCIMMI6ObnHEnr2G5Z3GdoRHaZbssdCjU0",
  authDomain: "medicad-2f419.firebaseapp.com",
  projectId: "medicad-2f419",
  storageBucket: "medicad-2f419.firebasestorage.app",
  messagingSenderId: "486692877365",
  appId: "1:486692877365:web:e386688bd522ae8f34ad7c",
  measurementId: "G-33KG5XNHBV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics safely (only if supported in the current environment)
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
  }
});
