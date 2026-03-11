"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db ,auth } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./page.module.css";

type UserDoc = {
  id: string; // uid
  email?: string;
  name?: string;
  displayName?: string;
  createdAt?: any;
};

async function callDeleteAuthUser(uid: string) {
  const url =
    "https://us-central1-renta-ca618.cloudfunctions.net/deleteUserByUid";

  const token = await auth.currentUser?.getIdToken(true);
  if (!token) throw new Error("no token");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ uid }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? "delete failed");
  return json;
}

async function deleteRoom(uid: string) {
  // サブコレクション messages を全削除
  const messagesSnap = await getDocs(collection(db, "rooms", uid, "messages"));
  for (const msgDoc of messagesSnap.docs) {
    await deleteDoc(doc(db, "rooms", uid, "messages", msgDoc.id));
  }
  // room ドキュメント本体を削除
  await deleteDoc(doc(db, "rooms", uid));
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { ready, isAdminClaim } = useRequireAuth();

  const [users, setUsers] = useState<UserDoc[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!isAdminClaim) return;

    setErr(null);

    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: UserDoc[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UserDoc, "id">),
        }));
        setUsers(list);
      },
      (e) => {
        console.error("users snapshot error:", e);
        setUsers([]);
        setErr("ユーザー一覧の取得に失敗しました（権限/ルールを確認）");
      }
    );

    return () => unsub();
  }, [ready, isAdminClaim]);

  if (!ready) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>読み込み中...</div>
      </main>
    );
  }

  if (!isAdminClaim) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>ユーザー一覧</h1>
          </div>
          <div className={styles.empty}>権限がありません</div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          戻る
        </button>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>ユーザー一覧</h1>
          <div className={styles.count}>件数: {users.length}</div>
        </div>

        {err && <div className={styles.empty} style={{ color: "#fecaca" }}>{err}</div>}

        {users.length === 0 ? (
          <div className={styles.empty}>ユーザーがいません</div>
        ) : (
          <div className={styles.userList}>
            {users.map((u) => {
              const name = u.displayName ?? "名前未設定";
              const initial = name.charAt(0).toUpperCase();
              return (
                <div key={u.id} className={styles.userCard}>
                  <div className={styles.avatar}>{initial}</div>

                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{name}</div>
                    <div className={styles.userEmail}>{u.email ?? "-"}</div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionButton}
                      onClick={() => router.push(`/talk/${u.id}`)}
                    >
                      トーク
                    </button>
                    <button
                      type="button"
                      className={styles.warnButton}
                      onClick={async () => {
                        if (!confirm(`「${name}」のトーク履歴を削除しますか？`)) return;
                        try {
                          await deleteRoom(u.id);
                          alert("トーク履歴を削除しました");
                        } catch (e: any) {
                          console.error(e);
                          alert(e?.message ?? "トーク削除に失敗しました");
                        }
                      }}
                    >
                      トーク削除
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={async () => {
                        if (!confirm(`「${name}」を削除しますか？`)) return;
                        try {
                          await deleteDoc(doc(db, "users", u.id));
                          await callDeleteAuthUser(u.id);
                          alert("削除しました");
                        } catch (e: any) {
                          console.error(e);
                          alert(e?.message ?? "削除に失敗しました");
                        }
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
