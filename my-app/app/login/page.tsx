// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./login.css";
import {loginWithEmailPassword}from "./lib/loginActions"
import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // ★ すでにログイン済みなら管理画面へ
        router.replace("/admin");
      }
    });

    return () => unsub();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    if (email !== ADMIN_EMAIL) {
      setError("このアカウントは許可されていません");
      return;
    }

    try {
      await loginWithEmailPassword({ email, password });
      router.push("/admin");
    } catch (e) {
      console.warn(e);
      setError(e instanceof Error ? e.message : "ログインに失敗しました");
    }
  }

  return (
    <main className="login-root">
      <div className="login-card">
        <h1 className="login-title">ログイン</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />

          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />

          <button type="submit" className="login-button">
            ログイン
          </button>
          
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="login-button"
          >
            アカウント作成
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}
      </div>
    </main>
  );
}

