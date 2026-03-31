import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/proposta",
  "/calculadora",
  "/analise-mensal",
  "/upload-fatura",
  "/admin",
  "/api/clients",
  "/api/proposals",
  "/api/calculations",
  "/api/reports",
  "/api/checkout",
  "/api/me",
  "/configuracoes",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // NextAuth armazena o token nestes cookies (http vs https)
  const token =
    req.cookies.get("next-auth.session-token") ??
    req.cookies.get("__Secure-next-auth.session-token");

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/proposta/:path*",
    "/calculadora/:path*",
    "/analise-mensal/:path*",
    "/upload-fatura/:path*",
    "/admin/:path*",
    "/api/clients/:path*",
    "/api/proposals/:path*",
    "/api/calculations/:path*",
    "/api/reports/:path*",
    "/api/checkout",
    "/api/me/:path*",
    "/configuracoes/:path*",
  ],
};
