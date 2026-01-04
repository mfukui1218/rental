// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCM_4Yv_5UPQgu38-4SCRUfsl_ggKY-juY",
  authDomain: "renta-ca618.firebaseapp.com",
  projectId: "renta-ca618",
  storageBucket: "renta-ca618.firebasestorage.app",
  messagingSenderId: "304499424282",
  appId: "1:304499424282:web:954f7be5164bd7061965a3",
  measurementId: "G-VXH6JXLTGQ"
};

export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;

export async function getMessagingIfSupported() {
  const ok = await isSupported();
  return ok ? getMessaging(app) : null;
}

export function isAdminEmail(): boolean {
  const admin = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const email = auth.currentUser?.email;
  return !!admin && !!email && email.toLowerCase() === admin.toLowerCase();
}
