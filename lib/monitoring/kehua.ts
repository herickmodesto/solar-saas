import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

// Kehua (科华) — cloud.kehua.com agent portal
const BASE = "https://cloud.kehua.com/api";

let _token: string | null = null;
let _tokenAt = 0;
const TOKEN_TTL = 3600 * 1000;

async function getToken(username: string, password: string): Promise<string> {
  if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.token) throw new Error(`Kehua auth error: ${data?.message ?? res.status}`);
  _token = data.data.token;
  _tokenAt = Date.now();
  return _token!;
}

async function khReq(username: string, password: string, path: string, body?: Record<string, unknown>) {
  const token = await getToken(username, password);
  const res = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Kehua API error ${res.status}`);
  return res.json();
}

export class KehuaAdapter implements MonitoringAdapter {
  constructor(private username: string, private password: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await khReq(this.username, this.password, "/station/page", { pageNo: 1, pageSize: 100 });
    const list = data?.data?.records ?? data?.data?.list ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.stationId ?? p.id),
      name: String(p.stationName ?? p.name ?? p.stationId),
      nominalPower: p.capacity ? Number(p.capacity) : undefined,
      city: p.address ? String(p.address) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await khReq(this.username, this.password, `/station/${externalId}/realtime`);
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.activePower ?? d.pac ?? 0),
      todayKwh: Number(d.dayEnergy ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.totalEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await khReq(this.username, this.password, `/station/${externalId}/devices`);
    const list = data?.data ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.deviceSn),
      model: d.model ? String(d.model) : undefined,
      status: String(d.status ?? ""),
      currentKw: Number(d.activePower ?? 0),
    }));
  }
}
