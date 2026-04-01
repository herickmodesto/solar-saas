import { NextRequest, NextResponse } from "next/server";
import { requireAuth, withErrorHandler } from "@/lib/auth";
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

type SyncResult = {
  provider: string;
  synced: number;
  created: number;
  errors: string[];
};

// Deriva status a partir dos dispositivos
function deriveStatus(deviceStatuses: string[]): "NORMAL" | "ALERT" | "CRITICAL" | "OFFLINE" | "UNKNOWN" {
  if (deviceStatuses.length === 0) return "UNKNOWN";
  if (deviceStatuses.every(s => s === "1" || s.toLowerCase() === "normal" || s === "0")) return "NORMAL";
  if (deviceStatuses.some(s => ["3", "fault", "critical", "error"].includes(s.toLowerCase()))) return "CRITICAL";
  if (deviceStatuses.some(s => ["2", "warning", "alert"].includes(s.toLowerCase()))) return "ALERT";
  if (deviceStatuses.every(s => s === "" || s === "offline" || s === "4")) return "OFFLINE";
  return "NORMAL";
}

async function syncProvider(
  userId: string,
  provider: string,
  adapter: MonitoringAdapter
): Promise<SyncResult> {
  const result: SyncResult = { provider, synced: 0, created: 0, errors: [] };

  // Busca lista de plantas externas
  let externalPlants;
  try {
    externalPlants = await adapter.getPlantList();
  } catch (e) {
    result.errors.push(`getPlantList: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }

  // Para cada planta externa, verifica se já existe no banco
  for (const ext of externalPlants) {
    try {
      const existing = await prisma.plant.findFirst({
        where: { userId, externalPlantId: ext.externalId, inverterProvider: provider as never },
      });

      let plantId: string;

      if (!existing) {
        // Cria a planta automaticamente
        const created = await prisma.plant.create({
          data: {
            userId,
            name: ext.name,
            externalPlantId: ext.externalId,
            inverterProvider: provider as never,
            systemKwp: ext.nominalPower ?? null,
            city: ext.city ?? null,
            status: "UNKNOWN",
          },
        });
        plantId = created.id;
        result.created++;
      } else {
        plantId = existing.id;
      }

      // Busca stats e dispositivos
      const [stats, devices] = await Promise.all([
        adapter.getPlantStats(ext.externalId).catch(() => null),
        adapter.getDevices(ext.externalId).catch(() => []),
      ]);

      // Upsert dispositivos
      for (const dev of devices) {
        const existingDev = await prisma.plantDevice.findFirst({ where: { plantId, serialNumber: dev.serialNumber } });
        if (existingDev) {
          await prisma.plantDevice.update({
            where: { id: existingDev.id },
            data: { status: dev.status ?? "", currentKw: dev.currentKw, lastSyncAt: new Date(), model: dev.model ?? null },
          });
        } else {
          await prisma.plantDevice.create({
            data: {
              plantId,
              serialNumber: dev.serialNumber,
              brand: provider,
              model: dev.model ?? null,
              status: dev.status ?? "",
              currentKw: dev.currentKw,
              lastSyncAt: new Date(),
            },
          });
        }
      }

      const deviceStatuses = devices.map(d => d.status ?? "");
      const status = deriveStatus(deviceStatuses);

      await prisma.plant.update({
        where: { id: plantId },
        data: {
          status,
          lastSyncAt: new Date(),
          ...(ext.nominalPower && { systemKwp: ext.nominalPower }),
          ...(ext.city && { city: ext.city }),
        },
      });

      // Salva snapshot de energia do dia
      if (stats) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        await prisma.plantEnergyLog.upsert({
          where: { plantId_date: { plantId, date: today } },
          update: { currentKw: stats.currentKw, todayKwh: stats.todayKwh, monthKwh: stats.monthKwh, yearKwh: stats.yearKwh, totalKwh: stats.totalKwh },
          create: { plantId, date: today, currentKw: stats.currentKw, todayKwh: stats.todayKwh, monthKwh: stats.monthKwh, yearKwh: stats.yearKwh, totalKwh: stats.totalKwh },
        });
      }

      result.synced++;
    } catch (e) {
      result.errors.push(`${ext.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return result;
}

export const POST = withErrorHandler(async (_req: NextRequest) => {
  const user = await requireAuth();

  // Busca todas as credenciais do usuário
  const credentials = await prisma.monitoringCredential.findMany({
    where: { userId: user.id, isActive: true },
  });

  if (credentials.length === 0) {
    return NextResponse.json({ message: "Nenhuma credencial configurada.", results: [] });
  }

  const results: SyncResult[] = [];

  for (const cred of credentials) {
    let adapter: MonitoringAdapter | null = null;

    try {
      switch (cred.provider) {
        case "GROWATT":
          // GrowattAdapter lê credenciais das env vars (GROWATT_USER, GROWATT_PASSWORD)
          adapter = new GrowattAdapter();
          break;

        case "SOLIS":
          if (cred.apiKey && cred.apiSecret) {
            adapter = new SolisAdapter(cred.apiKey, cred.apiSecret, cred.serverUrl ?? undefined);
          }
          break;

        case "DEYE":
          if (cred.apiKey && cred.apiSecret) {
            adapter = new DeyeAdapter(cred.apiKey, cred.apiSecret, cred.serverUrl ?? undefined);
          }
          break;

        case "SUNGROW":
          if (cred.username && cred.password) {
            adapter = new SungrowAdapter(cred.username, cred.password, cred.serverUrl ?? undefined);
          }
          break;

        case "GOODWE":
        case "WEG":
          if (cred.username && cred.password) {
            adapter = new GoodWeAdapter(cred.username, cred.password);
          }
          break;

        case "HOYMILES":
          if (cred.username && cred.password) {
            adapter = new HoymileesAdapter(cred.username, cred.password);
          }
          break;

        case "SOLARMAN":
          if (cred.username && cred.password) {
            adapter = new SolarmanAdapter(cred.username, cred.password);
          }
          break;

        case "INTELBRAS":
          if (cred.username && cred.password) {
            adapter = new IntelbrasAdapter(cred.username, cred.password);
          }
          break;

        case "CHINT":
          if (cred.apiKey) {
            adapter = new ChintAdapter(cred.apiKey);
          }
          break;

        case "SOLPLANET":
          if (cred.apiKey && cred.apiSecret) {
            adapter = new SolplanetAdapter(cred.apiKey, cred.apiSecret);
          }
          break;

        case "NEP":
          if (cred.username && cred.password) {
            adapter = new NepAdapter(cred.username, cred.password);
          }
          break;

        case "ELEKEEPER":
          if (cred.username && cred.password) {
            adapter = new ElekeeperAdapter(cred.username, cred.password);
          }
          break;

        case "KEHUA":
          if (cred.username && cred.password) {
            adapter = new KehuaAdapter(cred.username, cred.password);
          }
          break;

        default:
          results.push({ provider: cred.provider, synced: 0, created: 0, errors: [`Provider ${cred.provider} ainda não tem adapter implementado.`] });
          continue;
      }

      if (!adapter) {
        results.push({ provider: cred.provider, synced: 0, created: 0, errors: ["Credenciais incompletas (faltam campos obrigatórios)."] });
        continue;
      }

      const result = await syncProvider(user.id, cred.provider, adapter);

      // Atualiza lastTestAt da credencial
      await prisma.monitoringCredential.update({
        where: { id: cred.id },
        data: { lastTestAt: new Date() },
      });

      results.push(result);

    } catch (e) {
      results.push({
        provider: cred.provider,
        synced: 0,
        created: 0,
        errors: [e instanceof Error ? e.message : String(e)],
      });
    }
  }

  const totalSynced = results.reduce((s, r) => s + r.synced, 0);
  const totalCreated = results.reduce((s, r) => s + r.created, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors.length, 0);

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    totalSynced,
    totalCreated,
    totalErrors,
    results,
  });
});
