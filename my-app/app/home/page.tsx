// app/home/page.tsx
"use client";

import { useRouter } from "next/navigation";
import styles from "./home.module.css";

type MenuItem = {
  title: string;
  desc: string;
  href: string;
  variant?: "normal" | "admin";
};

export default function HomePage() {
  const router = useRouter();

  const items: MenuItem[] = [
    { title: "レンタル商品一覧", desc: "レンタルできる物件を見る", href: "/rentals" },
    { title: "", desc: "物件・予約の管理者用", href: "/login", variant: "admin" },
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
