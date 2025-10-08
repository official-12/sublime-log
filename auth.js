// Import the functions you need from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ✅ Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRnNoRJ4Zgtu-KEZAdOAKtou2LV9rdL5c",
  authDomain: "sublime-log.firebaseapp.com",
  projectId: "sublime-log",
  storageBucket: "sublime-log.firebasestorage.app",
  messagingSenderId: "644554254089",
  appId: "1:644554254089:web:dd3374c9468046a5a015d8",
  measurementId: "G-YMPGVWCK16"
};

// 🔧 Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// 🔹 REGISTER FUNCTION
window.register = async function () {
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("🎉 Welcome to SUBLIME LOGS!");
    window.location.href = "dashboard1.html"; // Redirect after success
  } catch (error) {
    alert(error.message);
  }
};

// 🔹 LOGIN FUNCTION
window.login = async function () {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("👋 Welcome back to SUBLIME LOGS!");
    window.location.href = "dashboard1.html"; // Redirect after success
  } catch (error) {
    alert(error.message);
  }
};

// 🔹 TOGGLE PASSWORD VISIBILITY
window.togglePassword = function (inputId, icon) {
  const input = document.getElementById(inputId);
  input.type = input.type === "password" ? "text" : "password";
};
