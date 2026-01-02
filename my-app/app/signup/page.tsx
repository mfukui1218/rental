"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";
import { signupWithEmailPassword } from "./lib/signupActions";
import { requestApproval } from "./lib/approvalActions";

export default function SignUpPage() {
  const router = useRouter();

  // 登録用
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 許可申請用
  const [requestEmail, setRequestEmail] = useState("");
  const [error, setError] = useState("");
  const [requestStatus, setRequestStatus] = useState("");

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRequestStatus("");
  
    if (!email || !password || !confirmPassword) {
      setError("未入力の項目があります");
      return;
    }
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
  
    // ★ 管理者1人だけ作成を許可
    if (!ADMIN_EMAIL || email !== ADMIN_EMAIL) {
      setError("このメールアドレスではアカウント作成できません");
      return;
    }
  
    try {
      await signupWithEmailPassword({ email, password, confirmPassword });
      router.push("/admin");
    } catch (e) {
      console.warn("signup error:", e);
      setError(e instanceof Error ? e.message : "アカウント作成に失敗しました");
    }
  }

  async function handleRequestApproval() {
    setError("");
    setRequestStatus(""); 

    try {
      await requestApproval(requestEmail);
      setRequestEmail("");
      setRequestStatus("許可申請を送信しました。承認されると登録できるようになります。");
    } catch (e) {
      console.warn("requestApproval error:", e);
      if (e instanceof Error) setRequestStatus(e.message);
      else setRequestStatus("許可申請の送信に失敗しました。");
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>アカウント作成</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
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

          <button type="submit" className={styles.button}>
            登録
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className={styles.button}
          >
            ログイン画面へ戻る
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  );
}
