import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RentalsPage from "@/app/rentals/page";
import { getDocs } from "firebase/firestore";

const mockPush = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: { uid: "test-uid", email: "test@example.com" },
    ready: true,
    isAdminClaim: false,
  }),
}));

describe("RentalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タイトルが表示される", () => {
    render(<RentalsPage />);
    expect(screen.getByText("レンタル商品一覧")).toBeInTheDocument();
  });

  it("商品がない場合メッセージが表示される", async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({ docs: [] } as any);
    render(<RentalsPage />);
    await waitFor(() => {
      expect(screen.getByText("登録されている商品がありません。")).toBeInTheDocument();
    });
  });

  it("商品リストが表示される", async () => {
    vi.mocked(getDocs).mockResolvedValueOnce({
      docs: [
        {
          id: "r1",
          data: () => ({
            name: "テスト商品A",
            category: "500円/日",
            description: "説明A",
            imageUrl: "",
          }),
        },
        {
          id: "r2",
          data: () => ({
            name: "テスト商品B",
            category: "1000円/日",
            description: "説明B",
            imageUrl: "",
          }),
        },
      ],
    } as any);

    render(<RentalsPage />);
    await waitFor(() => {
      expect(screen.getByText("テスト商品A")).toBeInTheDocument();
      expect(screen.getByText("テスト商品B")).toBeInTheDocument();
    });
  });

  it("HOMEへボタンが動作する", () => {
    render(<RentalsPage />);
    const homeButton = screen.getByText("HOMEへ");
    homeButton.click();
    expect(mockPush).toHaveBeenCalledWith("/home");
  });
});
