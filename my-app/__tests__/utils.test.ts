import { describe, it, expect } from "vitest";

// ===== カレンダー関数のテスト =====
// calendar page と request page で共通で使われるロジックを直接テスト

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

// requests page のフォーマット関数
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

function statusLabel(s?: string) {
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

// ===== Tests =====

describe("toDateStr", () => {
  it("正しいフォーマットで日付文字列を返す", () => {
    expect(toDateStr(2026, 0, 1)).toBe("2026-01-01");
    expect(toDateStr(2026, 11, 31)).toBe("2026-12-31");
    expect(toDateStr(2026, 2, 5)).toBe("2026-03-05");
  });

  it("月と日を0埋めする", () => {
    expect(toDateStr(2026, 0, 9)).toBe("2026-01-09");
    expect(toDateStr(2026, 8, 1)).toBe("2026-09-01");
  });
});

describe("getCalendarDays", () => {
  it("各行が7要素である", () => {
    const rows = getCalendarDays(2026, 2); // 2026年3月
    for (const row of rows) {
      expect(row.length).toBe(7);
    }
  });

  it("1から月末まで全日を含む", () => {
    const rows = getCalendarDays(2026, 2); // 2026年3月 = 31日
    const days = rows.flat().filter((d) => d !== null);
    expect(days.length).toBe(31);
    expect(Math.min(...(days as number[]))).toBe(1);
    expect(Math.max(...(days as number[]))).toBe(31);
  });

  it("2月の日数が正しい（うるう年）", () => {
    const rows = getCalendarDays(2024, 1); // 2024年2月（うるう年）
    const days = rows.flat().filter((d) => d !== null);
    expect(days.length).toBe(29);
  });

  it("2月の日数が正しい（平年）", () => {
    const rows = getCalendarDays(2026, 1); // 2026年2月（平年）
    const days = rows.flat().filter((d) => d !== null);
    expect(days.length).toBe(28);
  });

  it("先頭のnullは曜日オフセット", () => {
    // 2026年3月1日は日曜日 → オフセットは0
    const rows = getCalendarDays(2026, 2);
    expect(rows[0][0]).toBe(1);
  });
});

describe("isInRange", () => {
  it("範囲内の日付でtrueを返す", () => {
    expect(isInRange("2026-03-05", "2026-03-01", "2026-03-10")).toBe(true);
  });

  it("範囲の開始日でtrueを返す", () => {
    expect(isInRange("2026-03-01", "2026-03-01", "2026-03-10")).toBe(true);
  });

  it("範囲の終了日でtrueを返す", () => {
    expect(isInRange("2026-03-10", "2026-03-01", "2026-03-10")).toBe(true);
  });

  it("範囲外の日付でfalseを返す", () => {
    expect(isInRange("2026-02-28", "2026-03-01", "2026-03-10")).toBe(false);
    expect(isInRange("2026-03-11", "2026-03-01", "2026-03-10")).toBe(false);
  });
});

describe("getDatesInRange", () => {
  it("開始日と終了日が同じなら1要素", () => {
    expect(getDatesInRange("2026-03-15", "2026-03-15")).toEqual(["2026-03-15"]);
  });

  it("連続する日付をすべて返す", () => {
    expect(getDatesInRange("2026-03-01", "2026-03-03")).toEqual([
      "2026-03-01",
      "2026-03-02",
      "2026-03-03",
    ]);
  });

  it("月をまたぐ場合も正しい", () => {
    expect(getDatesInRange("2026-03-30", "2026-04-02")).toEqual([
      "2026-03-30",
      "2026-03-31",
      "2026-04-01",
      "2026-04-02",
    ]);
  });

  it("年をまたぐ場合も正しい", () => {
    expect(getDatesInRange("2026-12-30", "2027-01-02")).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});

describe("fmtDateTime", () => {
  it("nullで'-'を返す", () => {
    expect(fmtDateTime(null)).toBe("-");
    expect(fmtDateTime(undefined)).toBe("-");
  });

  it("Dateオブジェクトをフォーマットする", () => {
    const d = new Date(2026, 2, 10, 14, 30);
    expect(fmtDateTime(d)).toBe("2026/03/10 14:30");
  });

  it("タイムスタンプ数値をフォーマットする", () => {
    const ts = new Date(2026, 0, 1, 9, 5).getTime();
    expect(fmtDateTime(ts)).toBe("2026/01/01 09:05");
  });

  it("toDate()メソッドを持つオブジェクトをフォーマットする", () => {
    const ts = { toDate: () => new Date(2026, 5, 15, 12, 0) };
    expect(fmtDateTime(ts)).toBe("2026/06/15 12:00");
  });

  it("secondsプロパティを持つオブジェクトをフォーマットする", () => {
    const ts = { seconds: new Date(2026, 0, 1, 0, 0).getTime() / 1000 };
    expect(fmtDateTime(ts)).toBe("2026/01/01 00:00");
  });

  it("不明な型で'-'を返す", () => {
    expect(fmtDateTime({})).toBe("-");
    expect(fmtDateTime([])).toBe("-");
  });
});

describe("fmtDate", () => {
  it("ハイフンをスラッシュに変換する", () => {
    expect(fmtDate("2026-03-15")).toBe("2026/03/15");
  });

  it("undefinedで'-'を返す", () => {
    expect(fmtDate(undefined)).toBe("-");
  });
});

describe("fmtDateRange", () => {
  it("日付範囲をフォーマットする", () => {
    expect(fmtDateRange("2026-03-01", "2026-03-10")).toBe(
      "2026/03/01 〜 2026/03/10"
    );
  });

  it("片方がない場合'-'を返す", () => {
    expect(fmtDateRange("2026-03-01", undefined)).toBe("-");
    expect(fmtDateRange(undefined, "2026-03-10")).toBe("-");
    expect(fmtDateRange(undefined, undefined)).toBe("-");
  });
});

describe("statusLabel", () => {
  it("各ステータスに対応するラベルを返す", () => {
    expect(statusLabel("pending")).toBe("審査中");
    expect(statusLabel("approved")).toBe("承認");
    expect(statusLabel("rejected")).toBe("却下");
    expect(statusLabel("canceled")).toBe("キャンセル");
  });

  it("未定義のステータスで'-'を返す", () => {
    expect(statusLabel(undefined)).toBe("-");
    expect(statusLabel("unknown")).toBe("-");
  });
});
