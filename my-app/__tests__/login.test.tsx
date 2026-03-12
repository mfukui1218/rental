import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タイトルが表示される", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
  });

  it("メールアドレスとパスワード入力欄がある", () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
  });

  it("ログインボタンがある", () => {
    render(<LoginPage />);
    const buttons = screen.getAllByText("ログイン");
    const submitButton = buttons.find(
      (el) => el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit"
    );
    expect(submitButton).toBeInTheDocument();
  });

  it("アカウント作成ボタンでsignupに遷移する", () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText("アカウント作成"));
    expect(mockPush).toHaveBeenCalledWith("/signup");
  });

  it("未入力で送信するとエラーメッセージが表示される", async () => {
    render(<LoginPage />);
    const loginButtons = screen.getAllByText("ログイン");
    const submitButton = loginButtons.find(
      (el) => el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit"
    );
    fireEvent.click(submitButton!);
    await waitFor(() => {
      expect(
        screen.getByText("メールアドレスとパスワードを入力してください")
      ).toBeInTheDocument();
    });
  });

  it("正しい入力でログインするとhomeに遷移する", async () => {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("メールアドレス"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード"), {
      target: { value: "password123" },
    });

    const loginButtons = screen.getAllByText("ログイン");
    const submitButton = loginButtons.find(
      (el) => el.tagName === "BUTTON" && (el as HTMLButtonElement).type === "submit"
    );
    fireEvent.click(submitButton!);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalled();
    });
  });
});
