import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RequestClient from "@/app/request/RequestClient";
import { addDoc, getDoc } from "firebase/firestore";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: mockBack }),
  useSearchParams: () => new URLSearchParams("rentalId=test-rental-1"),
}));

vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: { uid: "test-uid", email: "test@example.com" },
    ready: true,
    isAdminClaim: false,
  }),
}));

describe("RequestClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: "test-rental-1",
      data: () => ({ blockedDates: ["2026-03-15", "2026-03-16"] }),
    } as any);
  });

  it("タイトルが表示される", () => {
    render(<RequestClient />);
    expect(screen.getByText("レンタル申込み")).toBeInTheDocument();
  });

  it("お名前入力欄がある", () => {
    render(<RequestClient />);
    expect(screen.getByPlaceholderText("例）山田 太郎")).toBeInTheDocument();
  });

  it("連絡先入力欄がある", () => {
    render(<RequestClient />);
    expect(screen.getByPlaceholderText("例）メールアドレス / 電話番号")).toBeInTheDocument();
  });

  it("カレンダーの曜日ヘッダーが表示される", () => {
    render(<RequestClient />);
    expect(screen.getByText("日")).toBeInTheDocument();
    expect(screen.getByText("月")).toBeInTheDocument();
    expect(screen.getByText("火")).toBeInTheDocument();
    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.getByText("木")).toBeInTheDocument();
    expect(screen.getByText("金")).toBeInTheDocument();
    expect(screen.getByText("土")).toBeInTheDocument();
  });

  it("予約可能・予約不可の凡例が表示される", () => {
    render(<RequestClient />);
    expect(screen.getByText("予約可能")).toBeInTheDocument();
    expect(screen.getByText("予約不可")).toBeInTheDocument();
  });

  it("開始日・終了日の表示がある", () => {
    render(<RequestClient />);
    expect(screen.getByText("開始日")).toBeInTheDocument();
    expect(screen.getByText("終了日")).toBeInTheDocument();
  });

  it("初期状態では未選択と表示される", () => {
    render(<RequestClient />);
    const unselected = screen.getAllByText("未選択");
    expect(unselected.length).toBe(2);
  });

  it("月のナビゲーションボタンがある", () => {
    render(<RequestClient />);
    expect(screen.getByText("<")).toBeInTheDocument();
    expect(screen.getByText(">")).toBeInTheDocument();
  });

  it("前月・次月ボタンで月が切り替わる", () => {
    render(<RequestClient />);
    const now = new Date();
    const currentLabel = `${now.getFullYear()}年 ${now.getMonth() + 1}月`;
    expect(screen.getByText(currentLabel)).toBeInTheDocument();

    fireEvent.click(screen.getByText(">"));

    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();
    expect(screen.getByText(`${nextYear}年 ${nextMonth}月`)).toBeInTheDocument();
  });

  it("名前未入力で送信するとアラートが出る", async () => {
    render(<RequestClient />);
    fireEvent.click(screen.getByText("送信"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("お名前を入力してください");
    });
  });

  it("日付未選択で送信するとアラートが出る", async () => {
    render(<RequestClient />);
    fireEvent.change(screen.getByPlaceholderText("例）山田 太郎"), {
      target: { value: "テスト太郎" },
    });
    fireEvent.click(screen.getByText("送信"));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "カレンダーで利用開始日と終了日を選択してください"
      );
    });
  });

  it("戻るボタンが動作する", () => {
    render(<RequestClient />);
    fireEvent.click(screen.getByText("戻る"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("備考欄がある", () => {
    render(<RequestClient />);
    expect(screen.getByPlaceholderText("用途・受け取り方法など")).toBeInTheDocument();
  });
});
