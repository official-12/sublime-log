import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy, setDoc, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDRnNoRJ4Zgtu-KEZAdOAKtou2LV9rdL5c",
  authDomain: "sublime-log.firebaseapp.com",
  projectId: "sublime-log",
  storageBucket: "sublime-log.appspot.com",
  messagingSenderId: "644554254089",
  appId: "1:644554254089:web:dd3374c9468046a5a015d8"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const user = auth.currentUser;

// Fetch user profile
async function fetchUserProfile() {
  if (!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    document.getElementById("name").innerText = `${data.firstName} ${data.surname}`;
    document.getElementById("email").innerText = data.email;
    document.getElementById("balance").innerText = data.balance || 0;
    document.getElementById("profilePic").src = data.picture || "default.png";
  }
}
fetchUserProfile();

// Update balance in real-time
if(user){
  const userRef = doc(db, "users", user.uid);
  onSnapshot(userRef, (docSnap) => {
    if(docSnap.exists()) document.getElementById("balance").innerText = docSnap.data().balance || 0;
  });
}

// Fetch transactions
async function fetchUserTransactions() {
  if (!user) return;
  const transactionsRef = collection(db, "transactions");
  const q = query(transactionsRef, where("userId", "==", user.uid), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  const tbody = document.getElementById("transactionTable");
  tbody.innerHTML = "";
  snapshot.forEach(doc => {
    const t = doc.data();
    const time = t.timestamp?.seconds ? new Date(t.timestamp.seconds * 1000).toLocaleString() : t.timestamp;
    tbody.innerHTML += `<tr>
      <td>${t.transactionId}</td>
      <td>${t.amount}</td>
      <td>${t.status}</td>
      <td>${time}</td>
    </tr>`;
  });
}
fetchUserTransactions();

// Paystack popup for funding wallet
document.getElementById("fundWalletBtn").addEventListener("click", async () => {
  const amount = parseInt(prompt("Enter amount to fund wallet (₦):"), 10);
  if(!amount || amount <= 0) return alert("Invalid amount");

  const handler = PaystackPop.setup({
    key: "pk_live_69a14ffd1eeecad2a0f9515ca0544c69d5444976", // public key
    email: user.email,
    amount: amount * 100,
    currency: "NGN",
    metadata: { user_id: user.uid },
    callback: async (response) => {
      const transRef = await addDoc(collection(db, "transactions"), {
        transactionId: response.reference,
        email: user.email,
        amount: amount,
        status: "success",
        userId: user.uid,
        timestamp: serverTimestamp(),
        gateway_response: "Fund wallet"
      });
      // Update balance
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const balance = userSnap.data().balance || 0;
      await setDoc(userRef, { balance: balance + amount }, { merge: true });
      fetchUserTransactions();
      alert("Wallet funded successfully!");
    },
    onClose: () => alert("Payment cancelled")
  });
  handler.openIframe();
});

// Buy Number button
document.getElementById("buyNumberBtn").addEventListener("click", async () => {
  if(!user) return;
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  let balance = userSnap.data().balance || 0;
  const cost = 500;
  if(balance < cost) return alert("Insufficient balance");

  // Deduct cost
  await setDoc(userRef, { balance: balance - cost }, { merge: true });

  // Generate fake number & OTP
  const number = "0" + Math.floor(Math.random() * 9000000000 + 1000000000); // 11 digits
  const otp = Math.floor(10000 + Math.random() * 90000); // 5 digits

  // Show on dashboard
  document.getElementById("numberDisplay").innerHTML = `Number: ${number} <button class="btn-copy" onclick="copyText('${number}')">Copy</button>`;
  document.getElementById("otpDisplay").innerHTML = `OTP: ${otp} <button class="btn-copy" onclick="copyText('${otp}')">Copy</button>`;

  // Add transaction
  await addDoc(collection(db, "transactions"), {
    transactionId: "NUM-" + Date.now(),
    email: user.email,
    amount: cost,
    status: "success",
    userId: user.uid,
    number: number,
    otp: otp,
    timestamp: serverTimestamp(),
    gateway_response: "Number purchase"
  });

  // Refresh transactions table
  fetchUserTransactions();

  alert("Number purchased successfully! OTP will appear when received.");
});

// Copy number or OTP
window.copyText = function(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert("Copied to clipboard!"))
    .catch(err => alert("Failed to copy: " + err));
};
