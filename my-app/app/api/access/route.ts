import { NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  const { password } = await req.json();

  // ここが「売ったパスワード」
  if (password !== process.env.ACCESS_PASSWORD) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Cookieに直接パスワードは入れない（署名トークンを入れる）
  const secret = new TextEncoder().encode(process.env.ACCESS_JWT_SECRET!);

  const token = await new SignJWT({ access: "rentals" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const res = NextResponse.json({ ok: true });

  // ✅ Cookie発行（JSから読めない= httpOnly）
  res.cookies.set("rentals_access", token, {
    httpOnly: true,
    secure: true,     // https のときだけ送る（本番必須）
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
