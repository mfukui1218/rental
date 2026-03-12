import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import AdminCalendarPage from "@/app/admin/calendar/page";
import { getDocs, getDoc, updateDoc } from "firebase/firestore";

const mockBack = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: mockBack }),
}));

vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: { uid: "admin-uid", email: "admin@gmail.com" },
    ready: true,
    isAdminClaim: true,
  }),
}));

describe("AdminCalendarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          id: "rental-1",
          data: () => ({
            name: "テスト商品A",
            category: "500円/日",
            imageUrl: "",
            createdAt: Date.now(),
          }),
        },
        {
          id: "rental-2",
          data: () => ({
            name: "テスト商品B",
            category: "1000円/日",
            imageUrl: "",
            createdAt: Date.now(),
          }),
        },
      ],
    } as any);

    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: "rental-1",
      data: () => ({ blockedDates: ["2026-03-15"] }),
    } as any);
  });

  it("タイトルが表示される", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText("予約カレンダー管理")).toBeInTheDocument();
    });
  });

  it("商品選択プルダウンが表示される", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText("商品を選択")).toBeInTheDocument();
    });
  });

  it("曜日ヘッダーが表示される", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText("日")).toBeInTheDocument();
      expect(screen.getByText("土")).toBeInTheDocument();
    });
  });

  it("凡例が表示される", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText("予約可能")).toBeInTheDocument();
      expect(screen.getByText("予約不可")).toBeInTheDocument();
    });
  });

  it("保存ボタンが表示される", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText("保存")).toBeInTheDocument();
    });
  });

  it("月ナビゲーションが動作する", async () => {
    await act(async () => {
      render(<AdminCalendarPage />);
    });

    const now = new Date();
    const currentLabel = `${now.getFullYear()}年 ${now.getMonth() + 1}月`;

    // Wait for loading to clear and calendar to appear
    await waitFor(() => {
      expect(screen.getByText(currentLabel)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText(">"));
    });

    const nextMonth = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    const nextYear = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();
    expect(screen.getByText(`${nextYear}年 ${nextMonth}月`)).toBeInTheDocument();
  });

  it("保存ボタンクリックでupdateDocが呼ばれる", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      expect(screen.getByText("保存")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  it("戻るボタンが動作する", async () => {
    render(<AdminCalendarPage />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("戻る"));
    });
    expect(mockBack).toHaveBeenCalled();
  });
});
