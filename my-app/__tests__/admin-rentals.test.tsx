import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RentalCreate from "@/app/admin/rentals/page";
import { getDocs, addDoc, deleteDoc } from "firebase/firestore";

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

describe("RentalCreate (管理者商品登録)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          id: "r1",
          data: () => ({
            name: "商品A",
            category: "500円",
            description: "説明A",
            imageUrl: "https://example.com/a.png",
            createdAt: Date.now(),
          }),
        },
      ],
    } as any);
  });

  it("タイトルが表示される", () => {
    render(<RentalCreate />);
    expect(screen.getByText("レンタル商品登録")).toBeInTheDocument();
  });

  it("新規登録モードで表示される", () => {
    render(<RentalCreate />);
    expect(screen.getByText("新規登録")).toBeInTheDocument();
  });

  it("入力欄が表示される", () => {
    render(<RentalCreate />);
    expect(screen.getByPlaceholderText("商品名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("料金")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("説明")).toBeInTheDocument();
  });

  it("登録ボタンが表示される", () => {
    render(<RentalCreate />);
    expect(screen.getByText("登録")).toBeInTheDocument();
  });

  it("商品名未入力で登録するとアラートが出る", () => {
    render(<RentalCreate />);
    fireEvent.click(screen.getByText("登録"));
    expect(window.alert).toHaveBeenCalledWith("商品名は必須です");
  });

  it("一覧に商品が表示される", async () => {
    render(<RentalCreate />);
    await waitFor(() => {
      expect(screen.getByText("商品A")).toBeInTheDocument();
    });
  });

  it("編集ボタンで編集モードに切り替わる", async () => {
    render(<RentalCreate />);
    await waitFor(() => {
      expect(screen.getByText("商品A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("編集"));
    expect(screen.getByText("編集モード")).toBeInTheDocument();
    expect(screen.getByText("編集をやめる")).toBeInTheDocument();
  });

  it("編集をやめるで新規登録モードに戻る", async () => {
    render(<RentalCreate />);
    await waitFor(() => {
      expect(screen.getByText("商品A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("編集"));
    fireEvent.click(screen.getByText("編集をやめる"));
    expect(screen.getByText("新規登録")).toBeInTheDocument();
  });

  it("削除ボタンでdeleteDocが呼ばれる", async () => {
    render(<RentalCreate />);
    await waitFor(() => {
      expect(screen.getByText("商品A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("削除"));
    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  it("戻るボタンが動作する", () => {
    render(<RentalCreate />);
    fireEvent.click(screen.getByText("戻る"));
    expect(mockBack).toHaveBeenCalled();
  });
});
