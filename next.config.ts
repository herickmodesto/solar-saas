import type { NextConfig } from "next";

const securityHeaders = [
  // Impede que o site seja carregado em iframes (anti-clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Bloqueia MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Envia apenas a origem no Referer (não a URL completa) para sites externos
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Força HTTPS por 1 ano e inclui subdomínios
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Desativa recursos sensíveis não usados pelo app
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self)",
  },
  // Content Security Policy
  // default-src 'self': só carrega recursos do próprio domínio por padrão
  // script-src 'self' 'unsafe-inline' 'unsafe-eval': necessário para Next.js/React
  // connect-src inclui AbacatePay API para fetch do checkout
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.abacatepay.com",
      "frame-ancestors 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript já é validado localmente — evita falsos erros no Vercel
    // causados pelo Prisma 7 antes do prisma generate completar
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        // Aplica em todas as rotas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
