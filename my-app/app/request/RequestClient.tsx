"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./page.module.css";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    row.push(d);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}

function isInRange(dateStr: string, start: string, end: string) {
  return dateStr >= start && dateStr <= end;
}

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

  // Calendar state
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectingStart, setSelectingStart] = useState(true);

  useEffect(() => {
    if (!rentalId) router.replace("/rentals");
  }, [rentalId, router]);

  // Load blocked dates
  useEffect(() => {
    if (!rentalId) return;
    (async () => {
      const snap = await getDoc(doc(db, "rentals", rentalId));
      const data = snap.data() as any;
      setBlockedDates(new Set(data?.blockedDates ?? []));
    })();
  }, [rentalId]);

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const handleDateClick = (dateStr: string) => {
    if (blockedDates.has(dateStr)) return;
    const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
    if (dateStr < todayStr) return;

    if (selectingStart) {
      setStartDate(dateStr);
      setEndDate("");
      setSelectingStart(false);
    } else {
      if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate("");
      } else {
        // Check if any blocked date is in the range
        let hasBlocked = false;
        for (const bd of blockedDates) {
          if (bd >= startDate && bd <= dateStr) {
            hasBlocked = true;
            break;
          }
        }
        if (hasBlocked) {
          alert("選択範囲に予約不可日が含まれています");
          return;
        }
        setEndDate(dateStr);
        setSelectingStart(true);
      }
    }
  };

  const calendarRows = getCalendarDays(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const submit = async () => {
    if (!rentalId) return;

    if (!name.trim()) {
      alert("お名前を入力してください");
      return;
    }
    if (!startDate || !endDate) {
      alert("カレンダーで利用開始日と終了日を選択してください");
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

        {/* Calendar date picker */}
        <div className={styles.field}>
          <label className={styles.label}>
            利用期間（カレンダーで{selectingStart ? "開始日" : "終了日"}を選択）
          </label>

          {/* Selected dates display */}
          <div className={styles.dateRange}>
            <div className={`${styles.dateCard} ${selectingStart ? styles.dateCardActive : ""}`}>
              <span className={styles.label}>開始日</span>
              <span className={styles.dateText}>{startDate || "未選択"}</span>
            </div>
            <div className={styles.rangeArrow}>→</div>
            <div className={`${styles.dateCard} ${!selectingStart ? styles.dateCardActive : ""}`}>
              <span className={styles.label}>終了日</span>
              <span className={styles.dateText}>{endDate || "未選択"}</span>
            </div>
          </div>

          {/* Month navigation */}
          <div className={styles.calMonthNav}>
            <button type="button" className={styles.calNavBtn} onClick={prevMonth}>&lt;</button>
            <span className={styles.calMonthLabel}>{year}年 {month + 1}月</span>
            <button type="button" className={styles.calNavBtn} onClick={nextMonth}>&gt;</button>
          </div>

          {/* Calendar */}
          <div className={styles.calGrid}>
            <div className={styles.calWeekRow}>
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`${styles.calWeekDay} ${i === 0 ? styles.calSun : ""} ${i === 6 ? styles.calSat : ""}`}
                >
                  {w}
                </div>
              ))}
            </div>
            {calendarRows.map((row, ri) => (
              <div key={ri} className={styles.calWeekRow}>
                {row.map((day, ci) => {
                  if (day === null) {
                    return <div key={ci} className={styles.calDayCell} />;
                  }
                  const dateStr = toDateStr(year, month, day);
                  const isBlocked = blockedDates.has(dateStr);
                  const isPast = dateStr < todayStr;
                  const isStart = dateStr === startDate;
                  const isEnd = dateStr === endDate;
                  const inRange = startDate && endDate && isInRange(dateStr, startDate, endDate);
                  const isDisabled = isBlocked || isPast;

                  let cls = styles.calDayCell;
                  if (!isDisabled) cls += ` ${styles.calDayBtn}`;
                  if (isBlocked) cls += ` ${styles.calBlocked}`;
                  if (isPast) cls += ` ${styles.calPast}`;
                  if (isStart || isEnd) cls += ` ${styles.calSelected}`;
                  if (inRange && !isStart && !isEnd) cls += ` ${styles.calInRange}`;
                  if (ci === 0) cls += ` ${styles.calSun}`;
                  if (ci === 6) cls += ` ${styles.calSat}`;

                  return (
                    <button
                      key={ci}
                      type="button"
                      className={cls}
                      onClick={() => !isDisabled && handleDateClick(dateStr)}
                      disabled={isDisabled}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className={styles.calLegend}>
            <span className={styles.calLegendItem}>
              <span className={`${styles.calLegendBox} ${styles.calLegendOk}`} /> 予約可能
            </span>
            <span className={styles.calLegendItem}>
              <span className={`${styles.calLegendBox} ${styles.calLegendNg}`} /> 予約不可
            </span>
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
