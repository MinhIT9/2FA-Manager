import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Cấu hình Firebase - thay YOUR_* bằng thông tin của bạn từ Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAITBQKnio3wog8kzt95EB5Rl2tj51sMJQ",
  authDomain: "fa-manager.firebaseapp.com",
  projectId: "fa-manager",
  storageBucket: "fa-manager.appspot.com",
  messagingSenderId: "1010233758400",
  appId: "1:1010233758400:web:6d889494c8db9f5779d325",
  measurementId: "G-PNNP34ZX13"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Xuất các service để dùng trong các file khác
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics };
