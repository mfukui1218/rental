"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";
import styles from "./page.module.css";

type RentalRequest = {
  id: string;
  rentalId?: string;
  name?: string;
  contact?: string;
  note?: string;
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
  const [uid, setUid] = useState<string | null>(null);
  const [items, setItems] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }

    const q = query(collection(db, "rentalRequests"), orderBy("createdAt", "desc"));

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
  }, [uid]);

  if (loading) return <div className={styles.page}><div className={styles.container}>読み込み中...</div></div>;

  if (!uid) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.headerRow}>
            <h1 className={styles.title}>レンタルリクエスト一覧</h1>
          </div>
          <div className={styles.empty}>ログインしてください。</div>
        </div>
      </main>
    );
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
            {items.map((r) => (
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
                      rentalId: <span style={{ fontFamily: "monospace" }}>{r.rentalId ?? "-"}</span>
                    </div>

                    <div className={styles.animal}>
                      連絡先: {r.contact ?? "-"}
                    </div>

                    <div className={styles.animal}>
                      送信: {fmtDateTime(r.createdAt)}
                    </div>

                    <div className={styles.desc}>
                      備考: {r.note ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
