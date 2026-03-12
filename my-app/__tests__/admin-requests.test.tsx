import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RentalRequestsPage from "@/app/admin/requests/page";
import { onSnapshot, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: mockBack }),
}));

vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: { uid: "admin-uid", email: "admin@gmail.com" },
    ready: true,
    isAdminClaim: true,
  }),
}));

const pendingRequest = {
  id: "req-1",
  rentalId: "rental-1",
  name: "田中太郎",
  contact: "test@example.com",
  startDate: "2026-04-01",
  endDate: "2026-04-03",
  note: "テスト備考",
  uid: "user-1",
  status: "pending",
  createdAt: { toDate: () => new Date("2026-03-10T10:00:00") },
};

const approvedRequest = {
  id: "req-2",
  rentalId: "rental-1",
  name: "山田花子",
  contact: "",
  startDate: "2026-04-10",
  endDate: "2026-04-12",
  note: "",
  uid: "user-2",
  status: "approved",
  createdAt: { toDate: () => new Date("2026-03-09T10:00:00") },
};

describe("RentalRequestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        { id: "rental-1", data: () => ({ name: "テスト商品" }) },
        { id: "user-1", data: () => ({ displayName: "タナカ" }) },
        { id: "user-2", data: () => ({ displayName: "ヤマダ" }) },
      ],
    } as any);

    vi.mocked(onSnapshot).mockImplementation((_q: any, onNext: any) => {
      onNext({
        docs: [
          { id: pendingRequest.id, data: () => ({ ...pendingRequest }) },
          { id: approvedRequest.id, data: () => ({ ...approvedRequest }) },
        ],
      });
      return vi.fn();
    });
  });

  it("タイトルが表示される", () => {
    render(<RentalRequestsPage />);
    expect(screen.getByText("レンタルリクエスト一覧")).toBeInTheDocument();
  });

  it("件数が表示される", () => {
    render(<RentalRequestsPage />);
    expect(screen.getByText("件数: 2")).toBeInTheDocument();
  });

  it("リクエスト名が表示される", () => {
    render(<RentalRequestsPage />);
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByText("山田花子")).toBeInTheDocument();
  });

  it("ステータスラベルが表示される", () => {
    render(<RentalRequestsPage />);
    expect(screen.getByText("審査中")).toBeInTheDocument();
    expect(screen.getByText("承認")).toBeInTheDocument();
  });

  it("pending のリクエストに承認・却下ボタンがある", () => {
    render(<RentalRequestsPage />);
    // 承認ボタンはpendingのリクエストにのみ表示
    const approveButtons = screen.getAllByText("承認");
    // 1つはステータスラベル、1つはボタン
    expect(approveButtons.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("却下")).toBeInTheDocument();
  });

  it("approved のリクエストには承認・却下ボタンがない", () => {
    // 承認済みリクエストのボタンは表示されない
    render(<RentalRequestsPage />);
    // 「承認」は2回出る：1つはステータスラベル用、1つはボタン（pendingリクエスト）
    const approveTexts = screen.getAllByText("承認");
    // ボタンとしての承認は1つだけ（pendingのreq-1のみ）
    const approveButtons = approveTexts.filter(
      (el) => el.tagName === "BUTTON"
    );
    expect(approveButtons.length).toBe(1);
  });

  it("承認ボタンでupdateDocが呼ばれる", async () => {
    render(<RentalRequestsPage />);

    const approveButtons = screen.getAllByText("承認").filter(
      (el) => el.tagName === "BUTTON"
    );
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  it("却下ボタンでupdateDocが呼ばれる", async () => {
    render(<RentalRequestsPage />);
    fireEvent.click(screen.getByText("却下"));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  it("削除ボタンでdeleteDocが呼ばれる", async () => {
    render(<RentalRequestsPage />);
    const deleteButtons = screen.getAllByText("削除");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  it("トークボタンで遷移する", () => {
    render(<RentalRequestsPage />);
    const talkButtons = screen.getAllByText("トーク");
    fireEvent.click(talkButtons[0]);
    expect(mockPush).toHaveBeenCalledWith("/talk/user-1");
  });

  it("戻るボタンが動作する", () => {
    render(<RentalRequestsPage />);
    fireEvent.click(screen.getByText("戻る"));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("RentalRequestsPage (リクエストなし)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as any);

    vi.mocked(onSnapshot).mockImplementation((_q: any, onNext: any) => {
      onNext({ docs: [] });
      return vi.fn();
    });
  });

  it("リクエストがない場合メッセージが表示される", () => {
    render(<RentalRequestsPage />);
    expect(screen.getByText("リクエストはまだありません。")).toBeInTheDocument();
  });
});

describe("RentalRequestsPage (権限なし)", () => {
  it("管理者以外にはエラーメッセージが表示される", async () => {
    const mod = await import("@/hooks/useRequireAuth");
    vi.spyOn(mod, "useRequireAuth").mockReturnValue({
      user: { uid: "user-1", email: "user@example.com" } as any,
      ready: true,
      isAdminClaim: false,
    });

    render(<RentalRequestsPage />);
    expect(screen.getByText("管理者専用ページです")).toBeInTheDocument();
  });
});
