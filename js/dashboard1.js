import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, orderBy, serverTimestamp, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Firebase config
import { firebaseConfig } from "./firebase.js";
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

// DOM elements
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const balanceEl = document.getElementById("balance");
const profilePicEl = document.getElementById("profilePic");
const uploadPicEl = document.getElementById("uploadPic");

const buyBtn = document.getElementById("buyNumberBtn");
const numberCard = document.getElementById("numberCard");
const numberEl = document.getElementById("number");
const otpEl = document.getElementById("otp");
const copyNumberBtn = document.getElementById("copyNumber");
const copyOtpBtn = document.getElementById("copyOtp");

const transactionTable = document.getElementById("transactionTable").getElementsByTagName('tbody')[0];

// --- FETCH USER PROFILE ---
async function fetchUserProfile() {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      nameEl.innerText = `${data.firstName} ${data.surname}`;
      emailEl.innerText = data.email;
      balanceEl.innerText = `₦${data.balance}`;
      profilePicEl.src = data.picture || "default.png";
    }
  });
}

// --- COPY FUNCTION ---
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert("Copied!"));
}

copyNumberBtn.addEventListener("click", () => copyToClipboard(numberEl.innerText));
copyOtpBtn.addEventListener("click", () => copyToClipboard(otpEl.innerText));

// --- GENERATE RANDOM NUMBER AND OTP ---
function generateNumber() {
  return Math.floor(10000000000 + Math.random() * 90000000000).toString();
}

function generateOtp() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// --- FETCH TRANSACTIONS ---
async function fetchTransactions() {
  const user = auth.currentUser;
  if (!user) return;

  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  transactionTable.innerHTML = "";
  querySnapshot.forEach(doc => {
    const t = doc.data();
    const row = transactionTable.insertRow();
    row.insertCell(0).innerText = t.transactionId;
    row.insertCell(1).innerText = `₦${t.amount}`;
    row.insertCell(2).innerText = t.status;
    row.insertCell(3).innerText = new Date(t.timestamp.seconds * 1000).toLocaleString();
  });
}

// --- BUY NUMBER (TEMP PURCHASE) ---
buyBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) return;

  // Here trigger Paystack checkout
  const amount = 500; // example for testing, update dynamically
  const userRef = doc(db, "users", user.uid);

  // Check balance
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;
  const balance = userSnap.data().balance;

  if (balance < amount) {
    alert("Insufficient balance! Please fund your account.");
    return;
  }

  // Deduct balance
  await updateDoc(userRef, { balance: balance - amount });

  // Generate number & OTP
  const number = generateNumber();
  const otp = generateOtp();

  // Save temp purchase
  await addDoc(collection(db, "tempPurchases"), {
    userId: user.uid,
    number,
    otp,
    amount,
    status: "success",
    timestamp: serverTimestamp()
  });

  // Display immediately
  numberCard.style.display = "block";
  numberEl.innerText = number;
  otpEl.innerText = otp;

  // Save transaction
  await addDoc(collection(db, "transactions"), {
    transactionId: `TXN-${Date.now()}`,
    userId: user.uid,
    amount,
    status: "success",
    timestamp: serverTimestamp()
  });

  // Refresh transactions table
  fetchTransactions();
});

// --- INITIAL LOAD ---
auth.onAuthStateChanged(user => {
  if (user) {
    fetchUserProfile();
    fetchTransactions();
  }
});
