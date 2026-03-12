import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "@/app/home/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
}));

// Admin user mock
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: { uid: "test-uid", email: "admin@gmail.com" },
    ready: true,
    isAdminClaim: true,
  }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HOMEタイトルが表示される", () => {
    render(<HomePage />);
    expect(screen.getByText("HOME")).toBeInTheDocument();
  });

  it("レンタル商品一覧ボタンがある", () => {
    render(<HomePage />);
    expect(screen.getByText("レンタル商品一覧")).toBeInTheDocument();
  });

  it("管理者用ボタンがadminユーザーに表示される", () => {
    render(<HomePage />);
    expect(screen.getByText("管理者用")).toBeInTheDocument();
  });

  it("レンタル商品一覧クリックで遷移する", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByText("レンタル商品一覧"));
    expect(mockPush).toHaveBeenCalledWith("/rentals");
  });

  it("管理者用クリックで遷移する", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByText("管理者用"));
    expect(mockPush).toHaveBeenCalledWith("/admin");
  });

  it("ログアウトボタンが動作する", async () => {
    const { signOut } = await import("firebase/auth");
    render(<HomePage />);
    fireEvent.click(screen.getByText("ログアウト"));
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });
});

describe("HomePage (一般ユーザー)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("一般ユーザーにはトークボタンが表示される", async () => {
    // Override mock for non-admin
    const mod = await import("@/hooks/useRequireAuth");
    vi.spyOn(mod, "useRequireAuth").mockReturnValue({
      user: { uid: "user-1", email: "user@example.com" } as any,
      ready: true,
      isAdminClaim: false,
    });

    render(<HomePage />);
    expect(screen.getByText("トーク")).toBeInTheDocument();
  });
});
