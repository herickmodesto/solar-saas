import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/usinas",
  "/desempenho",
  "/alertas",
  "/clientes",
  "/proposta",
  "/calculadora",
  "/analise-mensal",
  "/upload-fatura",
  "/faturas",
  "/contratos",
  "/financeiro",
  "/tickets",
  "/credenciais",
  "/configuracoes",
  "/planos",
  "/portal",
  "/admin",
  "/api/clients",
  "/api/plants",
  "/api/proposals",
  "/api/calculations",
  "/api/reports",
  "/api/invoices",
  "/api/contracts",
  "/api/tickets",
  "/api/monitoring-credentials",
  "/api/notifications",
  "/api/financeiro",
  "/api/checkout",
  "/api/me",
  "/api/upload",
  "/api/portal",
  "/api/desempenho",
  "/api/alertas",
  "/api/alerts",
];

// Rotas acessíveis apenas por integradores (não por clientes do portal)
const INTEGRATOR_ONLY_ROUTES = [
  "/dashboard",
  "/usinas",
  "/desempenho",
  "/alertas",
  "/clientes",
  "/proposta",
  "/calculadora",
  "/analise-mensal",
  "/upload-fatura",
  "/faturas",
  "/contratos",
  "/financeiro",
  "/tickets",
  "/credenciais",
  "/configuracoes",
  "/planos",
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
    "/usinas/:path*",
    "/clientes/:path*",
    "/proposta/:path*",
    "/calculadora/:path*",
    "/analise-mensal/:path*",
    "/upload-fatura/:path*",
    "/faturas/:path*",
    "/contratos/:path*",
    "/financeiro/:path*",
    "/tickets/:path*",
    "/credenciais/:path*",
    "/configuracoes/:path*",
    "/planos/:path*",
    "/portal/:path*",
    "/admin/:path*",
    "/api/clients/:path*",
    "/api/plants/:path*",
    "/api/proposals/:path*",
    "/api/calculations/:path*",
    "/api/reports/:path*",
    "/api/invoices/:path*",
    "/api/contracts/:path*",
    "/api/tickets/:path*",
    "/api/monitoring-credentials/:path*",
    "/api/notifications/:path*",
    "/api/financeiro/:path*",
    "/api/checkout",
    "/api/me/:path*",
    "/api/upload",
    "/api/portal/:path*",
    "/api/desempenho/:path*",
    "/api/alertas/:path*",
    "/api/alerts/:path*",
    "/desempenho/:path*",
    "/alertas/:path*",
  ],
};
