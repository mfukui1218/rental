import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ ロック対象から除外するもの
  // - 入室ページ
  // - Cookie発行API
  // - ログアウトAPI（任意）
  // - Next.js内部ファイル（_next）
  // - favicon等
  if (
    pathname === "/enter" ||
    pathname.startsWith("/api/access") ||
    pathname.startsWith("/api/logout") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // ✅ Cookieチェック（全ページ共通）
  const token = req.cookies.get("rentals_access")?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/enter";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // ✅ ほぼ全てに適用（ただし _next などは上で除外してる）
  matcher: ["/:path*"],
};
