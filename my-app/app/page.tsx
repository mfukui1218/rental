export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
        color: "#fff",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "720px",
          width: "100%",
          background: "rgba(0,0,0,0.35)",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            marginBottom: "16px",
            letterSpacing: "0.02em",
          }}
        >
          レンタルサービス
        </h1>

        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.6,
            opacity: 0.9,
            marginBottom: "28px",
          }}
        >
          限定公開のレンタル商品一覧です。<br />
          ご利用には専用パスワードが必要です。
        </p>

        <a
          href="/enter"
          style={{
            display: "inline-block",
            padding: "14px 28px",
            borderRadius: "12px",
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.6)",
            color: "#fff",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
            backdropFilter: "blur(6px)",
            transition: "all 0.25s",
          }}
        >
          パスワードを入力して入室
        </a>
      </div>
    </main>
  );
}
