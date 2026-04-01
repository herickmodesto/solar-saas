import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

// SolarMan Business API (https://dev.solarmanpv.com)
const BASE = "https://globalapi.solarmanpv.com";

let _token: string | null = null;
let _tokenAt = 0;
const TOKEN_TTL = 3600 * 1000;

async function getToken(email: string, password: string): Promise<string> {
  if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
  const res = await fetch(`${BASE}/account/v1.0/token?appId=intelbras`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appSecret: "", email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data?.access_token) throw new Error(`SolarMan auth error: ${data?.msg ?? res.status}`);
  _token = data.access_token;
  _tokenAt = Date.now();
  return _token!;
}

async function smRequest(email: string, password: string, path: string, body: Record<string, unknown>) {
  const token = await getToken(email, password);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SolarMan API error ${res.status}`);
  return res.json();
}

export class SolarmanAdapter implements MonitoringAdapter {
  constructor(private email: string, private password: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await smRequest(this.email, this.password, "/station/v1.0/list", { page: 1, size: 100 });
    const list = data?.stationList ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.id),
      name: String(p.name ?? p.id),
      nominalPower: p.capacity ? Number(p.capacity) : undefined,
      city: p.locationAddress ? String(p.locationAddress) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await smRequest(this.email, this.password, "/station/v1.0/realTime/data", { stationId: Number(externalId) });
    const d = data?.stationDataItems ?? {};
    return {
      currentKw: Number(d.generationPower ?? 0) / 1000,
      todayKwh: Number(d.dayEnergy ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.totalEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await smRequest(this.email, this.password, "/device/v1.0/list", { stationId: Number(externalId), page: 1, size: 100 });
    const list = data?.deviceListItems ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.deviceSn ?? d.deviceId),
      model: d.deviceType ? String(d.deviceType) : undefined,
      status: String(d.connectStatus ?? d.status ?? ""),
      currentKw: Number(d.generationPower ?? 0) / 1000,
    }));
  }
}
