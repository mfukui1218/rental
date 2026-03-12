import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import RentalPage from "@/app/rentals/[id]/page";
import { getDoc } from "firebase/firestore";

const mockPush = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: "test-rental-1" }),
}));

vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: { uid: "test-uid", email: "test@example.com" },
    ready: true,
    isAdminClaim: false,
  }),
}));

describe("RentalDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("商品詳細が表示される", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: "test-rental-1",
      data: () => ({
        name: "テスト商品",
        category: "1000円/日",
        description: "テスト説明文",
        imageUrl: "",
      }),
    } as any);

    render(<RentalPage />);
    await waitFor(() => {
      expect(screen.getByText("テスト商品")).toBeInTheDocument();
      expect(screen.getByText("テスト説明文")).toBeInTheDocument();
    });
  });

  it("存在しない商品ではメッセージが表示される", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      id: "missing",
      data: () => null,
    } as any);

    render(<RentalPage />);
    await waitFor(() => {
      expect(screen.getByText("この商品は登録されていません。")).toBeInTheDocument();
    });
  });

  it("申し込みボタンが存在する", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: "test-rental-1",
      data: () => ({
        name: "テスト商品",
        category: "1000円/日",
        description: "テスト説明文",
        imageUrl: "",
      }),
    } as any);

    render(<RentalPage />);
    await waitFor(() => {
      expect(screen.getByText("この商品を申し込む")).toBeInTheDocument();
    });
  });

  it("申し込みボタンで正しいURLに遷移する", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: "test-rental-1",
      data: () => ({
        name: "テスト商品",
        category: "1000円/日",
        description: "テスト",
        imageUrl: "",
      }),
    } as any);

    render(<RentalPage />);
    await waitFor(() => {
      screen.getByText("この商品を申し込む").click();
    });
    expect(mockPush).toHaveBeenCalledWith("/request?rentalId=test-rental-1");
  });

  it("一覧に戻るボタンが動作する", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      id: "test-rental-1",
      data: () => ({
        name: "テスト商品",
        category: "",
        description: "",
        imageUrl: "",
      }),
    } as any);

    render(<RentalPage />);
    await waitFor(() => {
      screen.getByText("一覧に戻る").click();
    });
    expect(mockPush).toHaveBeenCalledWith("/rentals");
  });
});
