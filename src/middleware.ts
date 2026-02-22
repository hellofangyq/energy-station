import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const langCookie = req.cookies.get("lang")?.value;
  if (!langCookie) {
    const header = req.headers.get("accept-language")?.toLowerCase() || "";
    const lang = header.startsWith("zh") ? "zh" : "en";
    const res = NextResponse.next();
    res.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"]
};
