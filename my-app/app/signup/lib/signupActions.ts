"use client";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db, app } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";

const REGION = "us-central1";
const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "ttnetnzua@gmail.com").toLowerCase();

async function checkAllowedOrAdmin(email: string) {
  const lower = email.toLowerCase().trim();
  if (lower === ADMIN_EMAIL) return true;

  const functions = getFunctions(app, REGION);
  const checkAllowed = httpsCallable(functions, "checkAllowedEmail");
  const res = await checkAllowed({ email: lower });
  const data = res.data as any;
  return !!data.allowed;
}

export async function signupWithEmailPassword(args: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const { email, password, confirmPassword } = args;

  if (password !== confirmPassword) {
    throw new Error("パスワードが一致しません");
  }

  const normalized = email.trim().toLowerCase();
  const allowed = await checkAllowedOrAdmin(normalized);

  if (!allowed) {
    throw new Error("このメールアドレスでは現在登録できません。下の許可申請フォームから申請できます。");
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, normalized, password);
    const user = cred.user;

    await setDoc(doc(db, "users", user.uid), {
      email: normalized,
      createdAt: serverTimestamp(),
    });

    return;
  } catch (e) {
    console.warn("signup error:", e);

    if (e instanceof FirebaseError) {
      if (e.code === "auth/email-already-in-use") throw new Error("このメールアドレスは既に登録されています。");
      if (e.code === "auth/invalid-email") throw new Error("メールアドレスの形式が正しくありません。");
      if (e.code === "auth/weak-password") throw new Error("パスワードが弱すぎます（6文字以上など）。");
      if (e.code === "auth/operation-not-allowed") throw new Error("メール/パスワード認証が無効です（Firebase Consoleで有効化して）。");
    }

    throw new Error("アカウント作成に失敗しました");
  }
}
