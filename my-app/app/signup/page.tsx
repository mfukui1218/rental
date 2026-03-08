"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import styles from "./signup.module.css";

export default function SignUpPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!displayName.trim() || !email || !password || !confirmPassword) {
      setError("未入力の項目があります");
      return;
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", cred.user.uid), {
        email: cred.user.email ?? null,
        displayName: displayName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.replace("/home");
    } catch (e) {
      console.warn("signup error:", e);
      setError("アカウント作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>アカウント作成</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="表示名（例：田中太郎）"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            className={styles.input}
          />

          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />

          <input
            type="password"
            placeholder="パスワード（確認）"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={styles.input}
          />

          <button
            type="submit"
            className={styles.button}
            disabled={loading}
          >
            {loading ? "作成中..." : "登録"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className={styles.input}
          >
            ログイン画面へ戻る
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  );
}
