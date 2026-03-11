"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./page.module.css";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type RentalRequest = {
  id: string;
  rentalId?: string;
  name?: string;
  contact?: string;
  note?: string;
  uid?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: Timestamp | any;
  status?: "pending" | "approved" | "rejected" | "canceled";
};

function fmtDateTime(ts: any) {
  if (!ts) return "-";
  let d: Date;

  if (typeof ts.toDate === "function") d = ts.toDate();
  else if (ts instanceof Date) d = ts;
  else if (typeof ts === "number") d = new Date(ts);
  else if (typeof ts === "string") d = new Date(ts);
  else if (typeof ts.seconds === "number") d = new Date(ts.seconds * 1000);
  else return "-";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function fmtDate(d?: string) {
  if (!d) return "-";
  return d.replaceAll("-", "/");
}

function fmtDateRange(start?: string, end?: string) {
  if (!start || !end) return "-";
  return `${fmtDate(start)} 〜 ${fmtDate(end)}`;
}

function statusLabel(s?: RentalRequest["status"]) {
  switch (s) {
    case "pending":
      return "審査中";
    case "approved":
      return "承認";
    case "rejected":
      return "却下";
    case "canceled":
      return "キャンセル";
    default:
      return "-";
  }
}

export default function RentalRequestsPage() {
  // ✅ Hooks は最上部で全部呼ぶ
  const router = useRouter();
  const { user, ready, isAdminClaim } = useRequireAuth();

  const [items, setItems] = useState<RentalRequest[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rentalNames, setRentalNames] = useState<Record<string, string>>({});
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // レンタル品の名前・ユーザーのニックネームを取得
  useEffect(() => {
    if (!ready || !user || !isAdminClaim) return;
    (async () => {
      try {
        const [rentalSnap, userSnap] = await Promise.all([
          getDocs(collection(db, "rentals")),
          getDocs(collection(db, "users")),
        ]);
        const rMap: Record<string, string> = {};
        rentalSnap.docs.forEach((d) => {
          rMap[d.id] = (d.data() as any).name ?? "";
        });
        setRentalNames(rMap);

        const uMap: Record<string, string> = {};
        userSnap.docs.forEach((d) => {
          const data = d.data() as any;
          uMap[d.id] = data.displayName || data.name || "";
        });
        setUserNames(uMap);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [ready, user, isAdminClaim]);

  // ✅ admin かつ user が確定した後にだけ購読
  useEffect(() => {
    if (!ready || !user || !isAdminClaim ) return;

    const q = query(
      collection(db, "rentalRequests"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: RentalRequest[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RentalRequest, "id">),
        }));
        setItems(list);
      },
      (err) => {
        console.error(err);
        setItems([]);
      }
    );

    return () => unsub();
  }, [ready, user, isAdminClaim ]);

  const deleteRentalRequest = async (id: string, label: string) => {
    if (!confirm(`このリクエストを削除しますか？\n${label}`)) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "rentalRequests", id));
    } catch (e) {
      console.error(e);
      alert("削除に失敗しました");
    } finally {
      setDeletingId(null);
    }
  };

  // ===== 表示分岐（return だけで制御） =====
  if (!ready) {
    return <div className={styles.page}><div className={styles.container}>読み込み中...</div></div>;
  }

  if (!isAdminClaim ) {
    return <div className={styles.page}><div className={styles.container}>管理者専用ページです</div></div>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>レンタルリクエスト一覧</h1>
          <div className={styles.count}>件数: {items.length}</div>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>リクエストはまだありません。</div>
        ) : (
          <div className={styles.partsGrid}>
            {items.map((r) => {
              const label = `${r.name ?? "（名前なし）"} / ${fmtDateRange(
                r.startDate,
                r.endDate
              )}`;

              return (
                <div key={r.id} className={styles.cardWrap}>
                  <div className={styles.cardButton}>
                    <div className={styles.cardUnit}>
                      <div className={styles.kv}>
                        <div className={styles.partName}>{r.name ?? "（名前なし）"}</div>
                        <div className={styles.animal}>{statusLabel(r.status)}</div>
                      </div>

                      <div className={styles.badge}>
                        期間: {fmtDateRange(r.startDate, r.endDate)}
                      </div>

                      <div className={styles.animal}>
                        商品: {r.rentalId ? (rentalNames[r.rentalId] || r.rentalId) : "-"}
                      </div>

                      <div className={styles.animal}>
                        ニックネーム: {r.uid ? (userNames[r.uid] || "-") : "-"}
                      </div>
                      <div className={styles.animal}>連絡先: {r.contact ?? "-"}</div>
                      <div className={styles.animal}>送信: {fmtDateTime(r.createdAt)}</div>
                      <div className={styles.desc}>備考: {r.note ?? "-"}</div>

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {r.uid && (
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => router.push(`/talk/${r.uid}`)}
                          >
                            トーク
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => deleteRentalRequest(r.id, label)}
                          disabled={deletingId === r.id}
                        >
                          {deletingId === r.id ? "削除中..." : "削除"}
                        </button>
                      </div>
                    </div>
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
