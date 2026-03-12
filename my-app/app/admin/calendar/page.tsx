"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import styles from "./calendar.module.css";

type RentalItem = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
};

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

export default function AdminCalendarPage() {
  const router = useRouter();
  const { ready, isAdminClaim } = useRequireAuth();

  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Load rental list
  useEffect(() => {
    if (!ready || !isAdminClaim) return;
    (async () => {
      const q = query(collection(db, "rentals"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? "",
          category: data.category ?? "",
          imageUrl: data.imageUrl ?? "",
        };
      });
      setRentals(items);
      if (items.length > 0 && !selectedId) setSelectedId(items[0].id);
    })();
  }, [ready, isAdminClaim]);

  // Load blocked dates when rental changes
  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    (async () => {
      const snap = await getDoc(doc(db, "rentals", selectedId));
      const data = snap.data() as any;
      setBlockedDates(new Set(data?.blockedDates ?? []));
      setLoading(false);
    })();
  }, [selectedId]);

  if (!ready || !isAdminClaim) return <div>読み込み中...</div>;

  const toggleDate = (dateStr: string) => {
    setBlockedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const saveBlockedDates = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "rentals", selectedId), {
        blockedDates: Array.from(blockedDates).sort(),
      });
      alert("保存しました");
    } catch (e) {
      console.error(e);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const calendarRows = getCalendarDays(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

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
        <h1 className={styles.title}>予約カレンダー管理</h1>
        <p className={styles.subtitle}>
          日付をクリックして予約不可日を設定できます（赤 = 予約不可）
        </p>

        {/* Rental selector */}
        <div className={styles.field}>
          <label className={styles.label}>商品を選択</label>
          <select
            className={styles.select}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {rentals.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}（{r.category}）
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <>
            {/* Month navigation */}
            <div className={styles.monthNav}>
              <button type="button" className={styles.navButton} onClick={prevMonth}>
                &lt;
              </button>
              <span className={styles.monthLabel}>
                {year}年 {month + 1}月
              </span>
              <button type="button" className={styles.navButton} onClick={nextMonth}>
                &gt;
              </button>
            </div>

            {/* Calendar grid */}
            <div className={styles.calendar}>
              {/* Weekday headers */}
              <div className={styles.weekRow}>
                {WEEKDAYS.map((w, i) => (
                  <div
                    key={w}
                    className={`${styles.weekDay} ${i === 0 ? styles.sun : ""} ${i === 6 ? styles.sat : ""}`}
                  >
                    {w}
                  </div>
                ))}
              </div>

              {/* Date cells */}
              {calendarRows.map((row, ri) => (
                <div key={ri} className={styles.weekRow}>
                  {row.map((day, ci) => {
                    if (day === null) {
                      return <div key={ci} className={styles.dayCell} />;
                    }
                    const dateStr = toDateStr(year, month, day);
                    const isBlocked = blockedDates.has(dateStr);
                    const isToday = dateStr === todayStr;
                    const isPast = dateStr < todayStr;

                    return (
                      <button
                        key={ci}
                        type="button"
                        className={`${styles.dayCell} ${styles.dayButton} ${isBlocked ? styles.blocked : ""} ${isToday ? styles.today : ""} ${isPast ? styles.past : ""} ${ci === 0 ? styles.sun : ""} ${ci === 6 ? styles.sat : ""}`}
                        onClick={() => toggleDate(dateStr)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.legendAvailable}`} />
                予約可能
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendBox} ${styles.legendBlocked}`} />
                予約不可
              </span>
            </div>

            {/* Save button */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.saveButton}
                onClick={saveBlockedDates}
                disabled={saving}
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
