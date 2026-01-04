// app/home/page.tsx
"use client";

import { useRouter } from "next/navigation";
import styles from "./home.module.css";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type MenuItem = {
  title: string;
  desc: string;
  href: string;
  variant?: "normal" | "admin";
};

export default function HomePage() {
  const router = useRouter();
  const { user, ready, isAdminEmail } = useRequireAuth();

  if (!ready) {
    return <div>読み込み中...</div>;
  }

  const items: MenuItem[] = [
    { title: "レンタル商品一覧", desc: "レンタルできる物件を見る", href: "/rentals" },

    // user がいるときだけ
    ...(user
      ? [{ title: "トーク", desc: "管理者とのトーク", href: `/talk/${user.uid}` } as MenuItem]
      : []),

    // 管理者だけ表示（見た目の制御）
    ...(isAdminEmail
      ? [{ title: "管理者用", desc: "物件・予約の管理者用", href: "/admin", variant: "admin" } as MenuItem]
      : []),
  ];

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>HOME</h1>
          <p className={styles.subtitle}>レンタル管理ポータル</p>
        </header>

        <div className={styles.grid}>
          {items.map((item) => {
            const cls =
              item.variant === "admin"
                ? `${styles.card} ${styles.adminCard}`
                : styles.card;

            return (
              <button
                key={item.title}
                type="button"
                className={cls}
                onClick={() => router.push(item.href)}
              >
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardDesc}>{item.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
