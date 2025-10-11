import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();
const user = auth.currentUser;

// ---------- Real-time user balance ----------
const userRef = doc(db, "users", user.uid);
onSnapshot(userRef, (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("name").innerText = `${data.firstName} ${data.surname}`;
    document.getElementById("email").innerText = data.email;
    document.getElementById("balance").innerText = `₦${data.balance}`;
  }
});

// ---------- Wallet Funding via Paystack ----------
document.getElementById("fundWalletBtn").addEventListener("click", () => {
  const amount = parseInt(prompt("Enter amount to fund wallet (NGN):")) * 100;
  if (!amount || amount < 100) return alert("Invalid amount.");

  const handler = PaystackPop.setup({
    key: "pk_live_69a14ffd1eeecad2a0f9515ca0544c69d5444976", // Live Public Key
    email: user.email,
    amount: amount,
    currency: "NGN",
    metadata: { user_id: user.uid },
    callback: async function (response) {
      // Payment success → update Firestore balance
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.data().balance || 0;
      await updateDoc(userRef, { balance: currentBalance + amount / 100 });

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        transactionId: response.reference,
        userId: user.uid,
        amount: amount / 100,
        status: "success",
        currency: "NGN",
        timestamp: new Date(),
        gateway_response: "paystack",
      });

      alert("Wallet funded successfully!");
    },
    onClose: function () { alert("Transaction cancelled."); },
  });
  handler.openIframe();
});

// ---------- Buy Number (₦500) ----------
document.getElementById("buyNumberBtn").addEventListener("click", async () => {
  const cost = 500;
  const userSnap = await getDoc(userRef);
  const userBalance = userSnap.data().balance || 0;
  if (userBalance < cost) return alert("Insufficient balance.");

  // Deduct balance
  await updateDoc(userRef, { balance: userBalance - cost });

  // Generate fake 11-digit number & 5-digit OTP
  const fakeNumber = `0${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  const fakeOTP = Math.floor(10000 + Math.random() * 90000);

  // Display on dashboard
  document.getElementById("number").innerText = fakeNumber;
  document.getElementById("otp").innerText = fakeOTP;

  // Record transaction
  const transactionRef = await addDoc(collection(db, "transactions"), {
    transactionId: `TXN${Date.now()}`,
    userId: user.uid,
    amount: cost,
    status: "success",
    currency: "NGN",
    timestamp: new Date(),
    gateway_response: "manual",
  });

  // Optional: trigger Pipedream webhook
  fetch("https://eo6rp415o24cz5w.m.pipedream.net/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.uid,
      number: fakeNumber,
      otp: fakeOTP,
      transactionId: transactionRef.id,
    }),
  });

  alert(`Number purchased!\nNumber: ${fakeNumber}\nOTP: ${fakeOTP}`);
});

// ---------- Real-time Transactions Table ----------
const transactionsRef = collection(db, "transactions");
const q = query(transactionsRef, orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
  const table = document.getElementById("transactionTable");
  table.innerHTML = snapshot.docs
    .filter(doc => doc.data().userId === user.uid)
    .map(doc => {
      const t = doc.data();
      return `<tr>
                <td>${t.transactionId}</td>
                <td>₦${t.amount}</td>
                <td>${t.status}</td>
                <td>${new Date(t.timestamp.seconds * 1000 || t.timestamp.toDate()).toLocaleString()}</td>
              </tr>`;
    }).join("");
});
