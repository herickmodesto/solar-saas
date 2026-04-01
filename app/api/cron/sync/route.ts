import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GrowattAdapter } from "@/lib/monitoring/growatt";
import { SolisAdapter } from "@/lib/monitoring/solis";
import { DeyeAdapter } from "@/lib/monitoring/deye";
import { SungrowAdapter } from "@/lib/monitoring/sungrow";
import { GoodWeAdapter } from "@/lib/monitoring/goodwe";
import { HoymileesAdapter } from "@/lib/monitoring/hoymiles";
import { SolarmanAdapter } from "@/lib/monitoring/solarman";
import { IntelbrasAdapter } from "@/lib/monitoring/intelbras";
import { ChintAdapter } from "@/lib/monitoring/chint";
import { SolplanetAdapter } from "@/lib/monitoring/solplanet";
import { NepAdapter } from "@/lib/monitoring/nep";
import { ElekeeperAdapter } from "@/lib/monitoring/elekeeper";
import { KehuaAdapter } from "@/lib/monitoring/kehua";
import type { MonitoringAdapter } from "@/lib/monitoring/types";

// GET /api/cron/sync — chamado por cron externo (Railway, Vercel Cron, etc.)
// Protegido por CRON_SECRET no header Authorization
export const GET = async (req: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Busca todas as credenciais ativas de todos os usuários
  const credentials = await prisma.monitoringCredential.findMany({
    where: { isActive: true },
  });

  let totalSynced = 0;
  let totalErrors = 0;

  for (const cred of credentials) {
    try {
      let adapter: MonitoringAdapter | null = null;

      switch (cred.provider) {
        case "GROWATT": adapter = new GrowattAdapter(); break;
        case "SOLIS": if (cred.apiKey && cred.apiSecret) adapter = new SolisAdapter(cred.apiKey, cred.apiSecret, cred.serverUrl ?? undefined); break;
        case "DEYE": if (cred.apiKey && cred.apiSecret) adapter = new DeyeAdapter(cred.apiKey, cred.apiSecret, cred.serverUrl ?? undefined); break;
        case "SUNGROW": if (cred.username && cred.password) adapter = new SungrowAdapter(cred.username, cred.password, cred.serverUrl ?? undefined); break;
        case "GOODWE": case "WEG": if (cred.username && cred.password) adapter = new GoodWeAdapter(cred.username, cred.password); break;
        case "HOYMILES": if (cred.username && cred.password) adapter = new HoymileesAdapter(cred.username, cred.password); break;
        case "SOLARMAN": if (cred.username && cred.password) adapter = new SolarmanAdapter(cred.username, cred.password); break;
        case "INTELBRAS": if (cred.username && cred.password) adapter = new IntelbrasAdapter(cred.username, cred.password); break;
        case "CHINT": if (cred.apiKey) adapter = new ChintAdapter(cred.apiKey); break;
        case "SOLPLANET": if (cred.apiKey && cred.apiSecret) adapter = new SolplanetAdapter(cred.apiKey, cred.apiSecret); break;
        case "NEP": if (cred.username && cred.password) adapter = new NepAdapter(cred.username, cred.password); break;
        case "ELEKEEPER": if (cred.username && cred.password) adapter = new ElekeeperAdapter(cred.username, cred.password); break;
        case "KEHUA": if (cred.username && cred.password) adapter = new KehuaAdapter(cred.username, cred.password); break;
        default: continue;
      }

      if (!adapter) continue;

      const plants = await adapter.getPlantList().catch(() => []);

      for (const ext of plants) {
        try {
          const plant = await prisma.plant.findFirst({
            where: { userId: cred.userId, externalPlantId: ext.externalId, inverterProvider: cred.provider as never },
          });
          if (!plant) continue;

          const stats = await adapter.getPlantStats(ext.externalId).catch(() => null);
          if (stats) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            await prisma.plantEnergyLog.upsert({
              where: { plantId_date: { plantId: plant.id, date: today } },
              update: { currentKw: stats.currentKw, todayKwh: stats.todayKwh, monthKwh: stats.monthKwh, yearKwh: stats.yearKwh, totalKwh: stats.totalKwh },
              create: { plantId: plant.id, date: today, currentKw: stats.currentKw, todayKwh: stats.todayKwh, monthKwh: stats.monthKwh, yearKwh: stats.yearKwh, totalKwh: stats.totalKwh },
            });
          }
          totalSynced++;
        } catch { totalErrors++; }
      }

      await prisma.monitoringCredential.update({ where: { id: cred.id }, data: { lastTestAt: new Date() } });
    } catch { totalErrors++; }
  }

  return NextResponse.json({ ok: true, totalSynced, totalErrors, syncedAt: new Date().toISOString() });
};
