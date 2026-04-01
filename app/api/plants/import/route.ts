import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

// POST /api/plants/import — importa usinas de planilha .xlsx ou .csv
// Colunas esperadas (case-insensitive): nome, cidade, estado, kwp, latitude, longitude, instalacao, cliente
export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireAuth();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) return NextResponse.json({ error: "Planilha vazia." }, { status: 400 });

  // Normaliza chave: "Nome da Usina" → "nomeDaUsina" → compara lowercase sem acento
  function col(row: Record<string, unknown>, ...keys: string[]): string {
    const lower = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ""), v]));
    for (const k of keys) {
      const norm = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "");
      if (lower[norm] !== undefined && lower[norm] !== "") return String(lower[norm]);
    }
    return "";
  }

  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const row of rows) {
    const name = col(row, "nome", "usina", "name", "nomeDaUsina", "plant");
    if (!name) { skipped.push("linha sem nome"); continue; }

    try {
      const city = col(row, "cidade", "city");
      const state = col(row, "estado", "state", "uf");
      const kwpRaw = col(row, "kwp", "kWp", "potencia", "capacidade", "systemKwp");
      const latRaw = col(row, "latitude", "lat");
      const lngRaw = col(row, "longitude", "lng", "lon");
      const installRaw = col(row, "instalacao", "dataInstalacao", "installDate");
      const clientName = col(row, "cliente", "client", "nomeCliente");

      let clientId: string | null = null;
      if (clientName) {
        const c = await prisma.client.findFirst({ where: { userId: user.id, name: { contains: clientName, mode: "insensitive" } } });
        clientId = c?.id ?? null;
      }

      const existing = await prisma.plant.findFirst({ where: { userId: user.id, name: { equals: name, mode: "insensitive" } } });
      if (existing) { skipped.push(name); continue; }

      await prisma.plant.create({
        data: {
          userId: user.id,
          name,
          city: city || null,
          state: state || null,
          systemKwp: kwpRaw ? parseFloat(kwpRaw) : null,
          latitude: latRaw ? parseFloat(latRaw) : null,
          longitude: lngRaw ? parseFloat(lngRaw) : null,
          installDate: installRaw ? new Date(installRaw) : null,
          clientId,
          status: "UNKNOWN",
        },
      });
      created.push(name);
    } catch (e) {
      errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ created: created.length, skipped: skipped.length, errors, createdNames: created });
});
