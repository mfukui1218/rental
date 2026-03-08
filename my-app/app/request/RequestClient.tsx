"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./page.module.css";

export default function RequestClient() {
  const router = useRouter();
  useRequireAuth();
  const searchParams = useSearchParams();

  const rentalId = searchParams.get("rentalId");

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!rentalId) router.replace("/rentals");
  }, [rentalId, router]);

  const openPicker = (ref: React.RefObject<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    if (typeof (el as any).showPicker === "function") (el as any).showPicker();
    else el.click();
  };

  const submit = async () => {
    if (!rentalId) return;

    if (!name.trim()) {
      alert("お名前を入力してください");
      return;
    }
    if (!startDate || !endDate) {
      alert("利用開始日と終了日を選択してください");
      return;
    }
    if (startDate > endDate) {
      alert("終了日は開始日以降にしてください");
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, "rentalRequests"), {
        rentalId,
        name: name.trim(),
        contact: contact.trim(),
        startDate,
        endDate,
        note,
        uid: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      alert("申込みを送信しました");
      router.push("/rentals");
    } catch (e) {
      console.error(e);
      alert("送信に失敗しました");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>レンタル申込み</h1>

        <div className={styles.field}>
          <label className={styles.label}>お名前（必須）</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例）山田 太郎"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>連絡先（任意）</label>
          <input
            className={styles.input}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="例）メールアドレス / 電話番号"
          />
        </div>

        <div className={styles.dateRange}>
          <div className={styles.dateCard}>
            <label className={styles.label}>利用開始日</label>
            <div className={styles.dateButtonRow}>
              <button type="button" className={styles.dateButton} onClick={() => openPicker(startRef)}>
                <span className={styles.dateText}>{startDate || "日付を選択"}</span>
                <span className={styles.calendarIcon} aria-hidden="true">📅</span>
              </button>
              <input
                ref={startRef}
                type="date"
                className={styles.hiddenDate}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.rangeArrow}>→</div>

          <div className={styles.dateCard}>
            <label className={styles.label}>利用終了日</label>
            <div className={styles.dateButtonRow}>
              <button type="button" className={styles.dateButton} onClick={() => openPicker(endRef)}>
                <span className={styles.dateText}>{endDate || "日付を選択"}</span>
                <span className={styles.calendarIcon} aria-hidden="true">📅</span>
              </button>
              <input
                ref={endRef}
                type="date"
                className={styles.hiddenDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>備考</label>
          <textarea
            className={styles.textarea}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="用途・受け取り方法など"
          />
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={submit} disabled={sending}>
            {sending ? "送信中..." : "送信"}
          </button>

          <button type="button" className={styles.subButton} onClick={() => router.back()}>
            戻る
          </button>
        </div>
      </div>
    </main>
  );
}
