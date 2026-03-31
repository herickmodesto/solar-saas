import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();
  const { name, companyName, companyCnpj, phone } = body;

  const data: Record<string, string> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof companyName === "string") data.companyName = companyName.trim();
  if (typeof companyCnpj === "string") data.companyCnpj = companyCnpj.trim();
  if (typeof phone === "string") data.phone = phone.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, companyName: true, companyCnpj: true, phone: true, emailVerified: true },
  });

  return NextResponse.json({ user: updated });
}
