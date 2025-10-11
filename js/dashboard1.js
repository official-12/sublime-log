// dashboard1.js
im// dashboard1.js
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();

// Elements
const nameEl = document.getElementById("name");
const emailEl = document.getElementById("email");
const balanceEl = document.getElementById("balance");
const numberEl = document.getElementById("number");
const otpEl = document.getElementById("otp");
const buyNumberBtn = document.getElementById("buyNumberBtn");
const transactionTable = document.getElementById("transactionTable");
const fundWalletBtn = document.getElementById("fundWalletBtn");

// Paystack keys
const paystackPublicKey = "pk_live_69a14ffd1eeecad2a0f9515ca0544c69d5444976";

let currentUser = null;

// Listen for auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserProfile();
    await loadTransactions();
  }
});

// Load user profile
async function loadUserProfile() {
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    nameEl.innerText = `${data.firstName || "John"} ${data.surname || "Doe"}`;
    emailEl.innerText = data.email || "example@mail.com";
    balanceEl.innerText = data.balance || 0;
  }
}

// Load transactions
async function loadTransactions() {
  const transactionsRef = collection(db, "transactions");
  const q = query(
    transactionsRef,
    where("userId", "==", currentUser.uid),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);
  const rows = [];
  snapshot.forEach(doc => {
    const t = doc.data();
    const date = t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000).toLocaleString() : "-";
    rows.push(`<tr>
      <td>${t.transactionId}</td>
      <td>₦${t.amount}</td>
      <td>${t.status}</td>
      <td>${date}</td>
    </tr>`);
  });
  transactionTable.innerHTML = rows.join("");
}

// Fund wallet
fundWalletBtn.addEventListener("click", () => {
  const amount = prompt("Enter amount to fund wallet (₦):", "500");
  if (!amount) return;
  const amountKobo = parseInt(amount) * 100;

  const handler = PaystackPop.setup({
    key: paystackPublicKey,
    email: emailEl.innerText,
    amount: amountKobo,
    currency: "NGN",
    metadata: {
      user_id: currentUser.uid
    },
    callback: async function(response) {
      alert("Wallet funded successfully!");
      await addTransaction(amount, response.reference, "success");
      await updateUserBalance(amount);
      await loadUserProfile();
      await loadTransactions();
    },
    onClose: function() {
      alert("Payment cancelled.");
    }
  });
  handler.openIframe();
});

// Buy number
buyNumberBtn.addEventListener("click", async () => {
  const userBalance = parseFloat(balanceEl.innerText);
  const numberCost = 500; // Fixed for now
  if (userBalance < numberCost) {
    alert("Insufficient balance. Please fund your wallet.");
    return;
  }

  // Deduct balance silently
  await updateUserBalance(-numberCost);

  // Generate fake 11-digit number and 5-digit OTP
  const number = "0" + Math.floor(1000000000 + Math.random() * 9000000000);
  const otp = Math.floor(10000 + Math.random() * 90000);

  numberEl.innerText = number;
  otpEl.innerText = otp;

  // Create transaction in Firestore
  const txRef = await addDoc(collection(db, "transactions"), {
    transactionId: `TX${Date.now()}`,
    userId: currentUser.uid,
    amount: numberCost,
    status: "success",
    timestamp: serverTimestamp(),
  });

  // Reload transactions and balance
  await loadTransactions();
  await loadUserProfile();
});

// Update user balance
async function updateUserBalance(amount) {
  const userRef = doc(db, "users", currentUser.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return;
  const data = snap.data();
  const newBalance = (data.balance || 0) + parseFloat(amount);
  await setDoc(userRef, { balance: newBalance }, { merge: true });
}

// Add transaction helper
async function addTransaction(amount, reference, status) {
  await addDoc(collection(db, "transactions"), {
    transactionId: reference || `TX${Date.now()}`,
    userId: currentUser.uid,
    amount,
    status,
    timestamp: serverTimestamp()
  });
}￼Enter
