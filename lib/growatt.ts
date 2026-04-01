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
      formulaCoal?: number;
    };
    devices?: Record<string, GrowattDevice[]>;
    weather?: unknown;
  }
>;

type GrowattDevice = {
  sn?: string;
  plantName?: string;
  deviceType?: string;
  status?: number;
  pac?: number; // current power W
  eDay?: number; // today energy kWh
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
  endTime?: string;
};

// Singleton session — reused across API requests
let _client: GrowattClient | null = null;
let _loginAt: number = 0;
const SESSION_TTL_MS = 50 * 60 * 1000; // 50 min

export async function getGrowattClient(): Promise<GrowattClient> {
  const now = Date.now();
  if (_client && _client.isConnected() && now - _loginAt < SESSION_TTL_MS) {
    return _client;
  }
  if (_client) {
    try { await _client.logout(); } catch { /* ignore */ }
  }

  const server = process.env.GROWATT_SERVER ?? "https://server.growatt.com";
  _client = new GrowattAPI({ server, timeout: 10000 }) as GrowattClient;
  await _client.login(process.env.GROWATT_USER!, process.env.GROWATT_PASSWORD!);
  _loginAt = now;
  return _client;
}

// ── Public helpers ────────────────────────────────────────────────

/** Returns all plants with real-time data from Growatt account */
export async function getAllPlants() {
  const client = await getGrowattClient();
  return client.getAllPlantData({
    plantData: true,
    deviceData: true,
    deviceTyp: true,
    weather: false,
    chartLastArray: false,
  });
}

/** Current power/energy stats for a single plant */
export async function getPlantStats(growattPlantId: string): Promise<{
  currentKw: number;
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  totalKwh: number;
}> {
  const client = await getGrowattClient();
  const data = await client.getPlantData(growattPlantId);
  return {
    currentKw: (data.currentPower ?? 0) / 1000,
    todayKwh: data.todayEnergy ?? 0,
    monthKwh: data.monthEnergy ?? 0,
    yearKwh: data.yearEnergy ?? 0,
    totalKwh: data.totalEnergy ?? 0,
  };
}

/** Recent fault/alert log for a plant */
export async function getPlantAlerts(growattPlantId: string, date: string): Promise<GrowattFaultLog[]> {
  const client = await getGrowattClient();
  try {
    return await client.getNewPlantFaultLog(growattPlantId, date);
  } catch {
    return [];
  }
}

/** Derive a PlantStatus string from Growatt data */
export function deriveStatus(data: GrowattAllPlantData[string]): "NORMAL" | "ALERT" | "CRITICAL" | "UNKNOWN" | "OFFLINE" {
  const devices = data.devices ?? {};
  const allDevices: GrowattDevice[] = Object.values(devices).flat();
  if (allDevices.length === 0) return "UNKNOWN";
  const statuses = allDevices.map((d) => d.status ?? -1);
  if (statuses.every((s) => s === 1)) return "NORMAL";
  if (statuses.some((s) => s === 3)) return "CRITICAL"; // fault
  if (statuses.some((s) => s === 0)) return "OFFLINE";
  return "ALERT";
}
