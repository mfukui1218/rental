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
  updateDoc,
  getDoc,
  arrayUnion,
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
  const [approvingId, setApprovingId] = useState<string | null>(null);
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

  // 日付範囲から全日付文字列を生成
  function getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const cur = new Date(start + "T00:00:00");
    const last = new Date(end + "T00:00:00");
    while (cur <= last) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  // 承認
  const approveRequest = async (r: RentalRequest) => {
    if (!confirm(`「${r.name}」のリクエストを承認しますか？\n期間の日付が予約不可になります。`)) return;

    setApprovingId(r.id);
    try {
      // ステータスを approved に更新
      await updateDoc(doc(db, "rentalRequests", r.id), { status: "approved" });

      // 期間内の日付を rental の blockedDates に追加
      if (r.rentalId && r.startDate && r.endDate) {
        const dates = getDatesInRange(r.startDate, r.endDate);
        await updateDoc(doc(db, "rentals", r.rentalId), {
          blockedDates: arrayUnion(...dates),
        });
      }
    } catch (e) {
      console.error(e);
      alert("承認に失敗しました");
    } finally {
      setApprovingId(null);
    }
  };

  // 却下
  const rejectRequest = async (r: RentalRequest) => {
    if (!confirm(`「${r.name}」のリクエストを却下しますか？`)) return;

    try {
      await updateDoc(doc(db, "rentalRequests", r.id), { status: "rejected" });
    } catch (e) {
      console.error(e);
      alert("却下に失敗しました");
    }
  };

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
        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.back()}
        >
          戻る
        </button>
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
                        <div className={`${styles.statusBadge} ${styles[`status_${r.status ?? "pending"}`]}`}>
                          {statusLabel(r.status)}
                        </div>
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

                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {r.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className={styles.approveButton}
                              onClick={() => approveRequest(r)}
                              disabled={approvingId === r.id}
                            >
                              {approvingId === r.id ? "処理中..." : "承認"}
                            </button>
                            <button
                              type="button"
                              className={styles.rejectButton}
                              onClick={() => rejectRequest(r)}
                            >
                              却下
                            </button>
                          </>
                        )}
                        {r.uid && (
                          <button
                            type="button"
                            className={styles.talkButton}
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
