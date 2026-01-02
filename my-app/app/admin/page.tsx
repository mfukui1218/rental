// app/admin/page.tsx
"use client";

import { useRouter } from "next/navigation";
import styles from "./admin.module.css";

export default function AdminPage() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>管理画面</h1>
        <p className={styles.subtitle}>管理者向けメニュー</p>

        <div className={styles.grid}>
          <button
            className={styles.card}
            onClick={() => router.push("/admin/rentals")}
          >
            <h2>商品登録</h2>
            <p>レンタル商品の新規登録</p>
          </button>

          <button
            className={styles.card}
            onClick={() => router.push("/rentals")}
          >
            <h2>商品一覧</h2>
            <p>公開中のレンタル商品を確認</p>
          </button>

          <button
            className={styles.card}
            onClick={() => router.push("/admin/requests")}
          >
            <h2>リクエスト一覧</h2>
            <p>リクエストを確認</p>
          </button>
		
          <button
            className={styles.card}
            onClick={() => router.push("/")}
          >
            <h2>トップへ</h2>
            <p>サイトトップに戻る</p>
          </button>
        </div>
      </div>
    </main>
  );
}
