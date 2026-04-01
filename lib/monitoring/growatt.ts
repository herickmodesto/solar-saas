import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const GrowattAPI = require("growatt");

type GrowattClient = {
  isConnected: () => boolean;
  login: (user: string, pass: string) => Promise<unknown>;
  logout: () => Promise<unknown>;
  getAllPlantData: (options: Record<string, boolean>) => Promise<GrowattAllPlantData>;
  getPlantData: (plantId: string | number) => Promise<GrowattPlantDataResponse>;
  getNewPlantFaultLog: (plantId: string | number, date: string, deviceSn?: string) => Promise<GrowattFaultLog[]>;
};

type GrowattAllPlantData = Record<
  string,
  {
    plantData?: {
      plantName?: string;
      nominalPower?: number;
      country?: string;
      city?: string;
      currentPower?: number;
      todayEnergy?: number;
      totalEnergy?: number;
    };
    devices?: Record<string, GrowattDevice[]>;
    weather?: unknown;
  }
>;

type GrowattDevice = {
  sn?: string;
  deviceType?: string;
  status?: number;
  pac?: number;
  eDay?: number;
  eMonth?: number;
  eTotal?: number;
};

type GrowattPlantDataResponse = {
  currentPower?: number;
  todayEnergy?: number;
  monthEnergy?: number;
  yearEnergy?: number;
  totalEnergy?: number;
};

type GrowattFaultLog = {
  alias?: string;
  deviceSn?: string;
  faultType?: number;
  faultCode?: number;
  key?: string;
  startTime?: string;
};

// Singleton session — reused across requests
let _client: GrowattClient | null = null;
let _loginAt = 0;
const SESSION_TTL_MS = 50 * 60 * 1000;

async function getClient(): Promise<GrowattClient> {
  const now = Date.now();
  if (_client && _client.isConnected() && now - _loginAt < SESSION_TTL_MS) return _client;
  if (_client) { try { await _client.logout(); } catch { /* ignore */ } }
  const server = process.env.GROWATT_SERVER ?? "https://server.growatt.com";
  _client = new GrowattAPI({ server, timeout: 10000 }) as GrowattClient;
  await _client.login(process.env.GROWATT_USER!, process.env.GROWATT_PASSWORD!);
  _loginAt = now;
  return _client;
}

export function deriveStatus(data: GrowattAllPlantData[string]): "NORMAL" | "ALERT" | "CRITICAL" | "UNKNOWN" | "OFFLINE" {
  const allDevices: GrowattDevice[] = Object.values(data.devices ?? {}).flat();
  if (allDevices.length === 0) return "UNKNOWN";
  const statuses = allDevices.map((d) => d.status ?? -1);
  if (statuses.every((s) => s === 1)) return "NORMAL";
  if (statuses.some((s) => s === 3)) return "CRITICAL";
  if (statuses.some((s) => s === 0)) return "OFFLINE";
  return "ALERT";
}

export async function getAllPlants() {
  const client = await getClient();
  return client.getAllPlantData({ plantData: true, deviceData: true, deviceTyp: true, weather: false, chartLastArray: false });
}

export class GrowattAdapter implements MonitoringAdapter {
  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await getAllPlants();
    return Object.entries(data).map(([id, d]) => ({
      externalId: id,
      name: d.plantData?.plantName ?? id,
      nominalPower: d.plantData?.nominalPower,
      city: d.plantData?.city,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const client = await getClient();
    const data = await client.getPlantData(externalId);
    return {
      currentKw: (data.currentPower ?? 0) / 1000,
      todayKwh: data.todayEnergy ?? 0,
      monthKwh: data.monthEnergy ?? 0,
      yearKwh: data.yearEnergy ?? 0,
      totalKwh: data.totalEnergy ?? 0,
    };
  }

  async getPlantAlerts(externalId: string, date?: string): Promise<ExternalAlert[]> {
    const client = await getClient();
    const d = date ?? new Date().toISOString().slice(0, 10);
    try {
      const logs: GrowattFaultLog[] = await client.getNewPlantFaultLog(externalId, d);
      return logs.map((l) => ({
        message: l.key ?? l.alias ?? "Fault",
        deviceSn: l.deviceSn,
        alertType: l.faultType === 3 ? "FAULT" : "WARNING",
        occurredAt: l.startTime ? new Date(l.startTime) : new Date(),
      }));
    } catch { return []; }
  }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const allData = await getAllPlants();
    const plantData = allData[externalId];
    if (!plantData?.devices) return [];
    return Object.values(plantData.devices).flat().map((d) => ({
      serialNumber: d.sn ?? "unknown",
      status: String(d.status ?? ""),
      currentKw: (d.pac ?? 0) / 1000,
    }));
  }
}
