// app/home/page.tsx
"use client";

import { useRouter } from "next/navigation";
import styles from "./home.module.css";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type MenuItem = {
  title: string;
  desc: string;
  href: string;
  variant?: "admin";
};

export default function HomePage() {
  const router = useRouter();
  const { user, ready, isAdminEmail } = useRequireAuth();

  if (!ready) {
    return <div>読み込み中...</div>;
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const items: MenuItem[] = [
    {
      title: "レンタル商品一覧",
      desc: "レンタルできる物件を見る",
      href: "/rentals",
    },

    ...(user
      ? [
          {
            title: "トーク",
            desc: "管理者とのトーク",
            href: `/talk/${user.uid}`,
          },
        ]
      : []),

    ...(isAdminEmail
      ? [
          {
            title: "管理者用",
            desc: "物件・予約の管理者用",
            href: "/admin",
            variant: "admin" as const,
          },
        ]
      : []),
  ];

  return (
    <main className={styles.page}>
      {/* ★ 右上固定ログアウト */}
      <button
        type="button"
        onClick={handleLogout}
        className={styles.logoutButton}
      >
        ログアウト
      </button>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>HOME</h1>
          <p className={styles.subtitle}>レンタル管理ポータル</p>
        </header>
      
        <div className={styles.grid}>
          {items.map((item) => (
            <button
              key={item.title}
              className={item.variant === "admin"
                ? `${styles.card} ${styles.adminCard}`
                : styles.card}
              onClick={() => router.push(item.href)}
            >
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardDesc}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
