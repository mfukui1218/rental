"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./enter.module.css";
import { useRequireAuth } from "@/hooks/useRequireAuth";



export default function EnterPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("パスワードが違います");
        return;
      }

      router.replace("/home");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>入室</h1>

        <p className={styles.desc}>
          ご利用には専用パスワードが必要です
        </p>

        <input
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
        />

        <button
          className={styles.button}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "確認中…" : "入る"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </main>
  );
}
