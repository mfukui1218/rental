"use client";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { checkAllowedOrAdmin } from "./authGate";

export async function loginWithEmailPassword(args: {
  email: string;
  password: string;
}) {
  const email = args.email.trim().toLowerCase();
  const password = args.password;

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);

    const loginEmail = result.user.email?.toLowerCase().trim();
    if (!loginEmail) {
      await signOut(auth);
      throw new Error("メールアドレスを取得できませんでした。");
    }

    const allowed = await checkAllowedOrAdmin(loginEmail);
    if (!allowed) {
      await signOut(auth);
      throw new Error("このメールアドレスではログインできません。");
    }

    // 成功：何も返さない
    return;
  } catch (e) {
    // Firebase Auth のエラーを人間語に変換
    if (e instanceof FirebaseError) {
      switch (e.code) {
        case "auth/invalid-email":
          throw new Error("メールアドレスの形式が正しくありません。");
        case "auth/user-not-found":
          throw new Error("このメールアドレスは登録されていません。");
        case "auth/wrong-password":
          throw new Error("パスワードが違います。");
        case "auth/too-many-requests":
          throw new Error("試行回数が多すぎます。しばらくしてから再試行してください。");
        default:
          throw new Error("ログインに失敗しました。");
      }
    }

    // それ以外（上で throw した Error もここに来る）
    if (e instanceof Error) {
      throw e;
    }

    throw new Error("ログインに失敗しました。");
  }
}
