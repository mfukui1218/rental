import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignUpPage from "@/app/signup/page";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", async () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: vi.fn() }),
}));

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("タイトルが表示される", () => {
    render(<SignUpPage />);
    expect(screen.getByText("アカウント作成")).toBeInTheDocument();
  });

  it("全入力欄が表示される", () => {
    render(<SignUpPage />);
    expect(screen.getByPlaceholderText("表示名（例：田中太郎）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード（確認）")).toBeInTheDocument();
  });

  it("未入力で送信するとエラーが表示される", async () => {
    render(<SignUpPage />);
    // required属性があるのでフォームsubmitを直接呼ぶ
    const form = screen.getByText("登録").closest("form")!;
    fireEvent.submit(form);
    // ブラウザバリデーションがjsdomでは動かないため、
    // handleSubmit内のバリデーションが走る
    await waitFor(() => {
      expect(screen.getByText("未入力の項目があります")).toBeInTheDocument();
    });
  });

  it("パスワード不一致でエラーが表示される", async () => {
    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText("表示名（例：田中太郎）"), {
      target: { value: "テスト" },
    });
    fireEvent.change(screen.getByPlaceholderText("メールアドレス"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード"), {
      target: { value: "pass1" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード（確認）"), {
      target: { value: "pass2" },
    });

    fireEvent.click(screen.getByText("登録"));
    await waitFor(() => {
      expect(screen.getByText("パスワードが一致しません")).toBeInTheDocument();
    });
  });

  it("正しい入力で登録するとhomeに遷移する", async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth");
    render(<SignUpPage />);

    fireEvent.change(screen.getByPlaceholderText("表示名（例：田中太郎）"), {
      target: { value: "テスト太郎" },
    });
    fireEvent.change(screen.getByPlaceholderText("メールアドレス"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード（確認）"), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByText("登録"));
    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    });
  });

  it("ログイン画面へ戻るボタンが動作する", () => {
    render(<SignUpPage />);
    fireEvent.click(screen.getByText("ログイン画面へ戻る"));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
