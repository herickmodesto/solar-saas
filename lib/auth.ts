import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

/**
 * Retorna a sessão autenticada no App Router (Server Components / Route Handlers).
 * Lança 401 se não autenticado.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new AuthError("Não autenticado.", 401);
  }
  return session.user;
}

/**
 * Extrai e valida JSON do body da request com tipagem genérica.
 */
export async function parseBody<T>(req: NextRequest): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new AuthError("Body JSON inválido.", 400);
  }
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Wrapper para route handlers que trata erros automaticamente.
 */
export function withErrorHandler(
  handler: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AuthError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      console.error("[API Error]", err);
      return Response.json({ error: "Erro interno no servidor." }, { status: 500 });
    }
  };
}
