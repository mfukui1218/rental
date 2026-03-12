import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AdminPage from "@/app/admin/page";

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

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("管理画面タイトルが表示される", () => {
    render(<AdminPage />);
    expect(screen.getByText("管理画面")).toBeInTheDocument();
  });

  it("商品登録ボタンが存在する", () => {
    render(<AdminPage />);
    expect(screen.getByText("商品登録")).toBeInTheDocument();
  });

  it("商品一覧ボタンが存在する", () => {
    render(<AdminPage />);
    expect(screen.getByText("商品一覧")).toBeInTheDocument();
  });

  it("リクエスト一覧ボタンが存在する", () => {
    render(<AdminPage />);
    expect(screen.getByText("リクエスト一覧")).toBeInTheDocument();
  });

  it("予約カレンダーボタンが存在する", () => {
    render(<AdminPage />);
    expect(screen.getByText("予約カレンダー")).toBeInTheDocument();
  });

  it("ユーザー一覧ボタンが存在する", () => {
    render(<AdminPage />);
    expect(screen.getByText("ユーザー一覧")).toBeInTheDocument();
  });

  it("各ボタンが正しい遷移先に遷移する", () => {
    render(<AdminPage />);

    fireEvent.click(screen.getByText("商品登録"));
    expect(mockPush).toHaveBeenCalledWith("/admin/rentals");

    fireEvent.click(screen.getByText("商品一覧"));
    expect(mockPush).toHaveBeenCalledWith("/rentals");

    fireEvent.click(screen.getByText("リクエスト一覧"));
    expect(mockPush).toHaveBeenCalledWith("/admin/requests");

    fireEvent.click(screen.getByText("予約カレンダー"));
    expect(mockPush).toHaveBeenCalledWith("/admin/calendar");

    fireEvent.click(screen.getByText("ユーザー一覧"));
    expect(mockPush).toHaveBeenCalledWith("/admin/users");

    fireEvent.click(screen.getByText("トップへ"));
    expect(mockPush).toHaveBeenCalledWith("/home");
  });

  it("戻るボタンが動作する", () => {
    render(<AdminPage />);
    fireEvent.click(screen.getByText("戻る"));
    expect(mockBack).toHaveBeenCalled();
  });
});

describe("AdminPage (権限なし)", () => {
  it("権限がないユーザーにはエラーメッセージが表示される", async () => {
    const mod = await import("@/hooks/useRequireAuth");
    vi.spyOn(mod, "useRequireAuth").mockReturnValue({
      user: { uid: "user-1", email: "user@example.com" } as any,
      ready: true,
      isAdminClaim: false,
    });

    render(<AdminPage />);
    expect(screen.getByText("権限がありません")).toBeInTheDocument();
  });
});
