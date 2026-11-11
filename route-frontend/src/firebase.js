// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnJ9D76s3jSf2VjBp7atUBjOK1MKp4fuw",
  authDomain: "projekt-zespolowy-lodz-route.firebaseapp.com",
  projectId: "projekt-zespolowy-lodz-route",
  storageBucket: "projekt-zespolowy-lodz-route.firebasestorage.app",
  messagingSenderId: "228151363187",
  appId: "1:228151363187:web:b099d11e1a4fdf11f58c06",
  measurementId: "G-NLVWYLDZLW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
<<<<<<< HEAD:src/firebase.js
// Експортуємо auth та provider, щоб використовувати їх у App.jsx
=======
// Eksportujemy auth i provider, aby używać ich w App.jsx.
>>>>>>> origin/main:route-frontend/src/firebase.js
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();