import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, serverTimestamp, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { loadStripe } from "@stripe/stripe-js"; // if using stripe fallback
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Firebase config (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyDRnNoRJ4Zgtu-KEZAdOAKtou2LV9rdL5c",
    authDomain: "sublime-log.firebaseapp.com",
    projectId: "sublime-log",
    storageBucket: "sublime-log.appspot.com",
    messagingSenderId: "644554254089",
    appId: "1:644554254089:web:dd3374c9468046a5a015d8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();

// Get current logged-in user
const user = auth.currentUser;

// PROFILE
const profilePic = document.getElementById("profilePic");
const uploadBtn = document.getElementById("uploadBtn");
const uploadInput = document.getElementById("uploadPic");

uploadBtn.addEventListener("click", () => uploadInput.click());
uploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileRef = ref(storage, `profilePics/${user.uid}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    profilePic.src = url;
    await updateDoc(doc(db, "users", user.uid), { picture: url });
});

// FETCH USER PROFILE
async function fetchUserProfile() {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const data = userSnap.data();
        document.getElementById("name").innerText = `${data.firstName} ${data.surname}`;
        document.getElementById("email").innerText = data.email;
        document.getElementById("balance").innerText = `₦${data.balance}`;
    }
}
fetchUserProfile();

// BUY NUMBER SECTION
const getNumberBtn = document.getElementById("getNumberBtn");
const numberSpan = document.getElementById("number");
const otpSpan = document.getElementById("otp");
const copyNumberBtn = document.getElementById("copyNumber");
const copyOtpBtn = document.getElementById("copyOtp");

function generateNumber() {
    return Math.floor(10000000000 + Math.random() * 90000000000).toString(); // 11 digits
}
function generateOtp() {
    return Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits
}

getNumberBtn.addEventListener("click", async () => {
    const price = 500;
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return alert("User not found");
    const balance = userSnap.data().balance;
    if (balance < price) return alert("Insufficient balance");

    const number = generateNumber();
    const otp = generateOtp();

    // Update wallet
    await updateDoc(userRef, { balance: balance - price });

    // Show on dashboard
    numberSpan.innerText = number;
    otpSpan.innerText = otp;
    document.getElementById("balance").innerText = `₦${balance - price}`;

    // Save purchase temporarily
