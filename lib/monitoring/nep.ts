import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

// NEP (Northern Electric & Power) — nepviewer.com cloud API
const BASE = "https://www.nepviewer.com/pv_monitor/proxy";

let _sid: string | null = null;
let _sidAt = 0;
const SID_TTL = 3600 * 1000;

async function getSid(username: string, password: string): Promise<string> {
  if (_sid && Date.now() - _sidAt < SID_TTL) return _sid;
  const params = new URLSearchParams({ name: username, password, lang: "en" });
  const res = await fetch(`${BASE}/Login?${params}`, { method: "GET" });
  const data = await res.json();
  if (!res.ok || !data?.data?.token) throw new Error(`NEP auth error: ${data?.msg ?? res.status}`);
  _sid = data.data.token;
  _sidAt = Date.now();
  return _sid!;
}

async function nepReq(username: string, password: string, path: string, params?: Record<string, string>) {
  const sid = await getSid(username, password);
  const qs = new URLSearchParams({ token: sid, ...params });
  const res = await fetch(`${BASE}${path}?${qs}`);
  if (!res.ok) throw new Error(`NEP API error ${res.status}`);
  return res.json();
}

export class NepAdapter implements MonitoringAdapter {
  constructor(private username: string, private password: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await nepReq(this.username, this.password, "/PowerStation/list", { page: "1", size: "100" });
    const list = data?.data?.list ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.stationId ?? p.id),
      name: String(p.stationName ?? p.name ?? p.stationId),
      nominalPower: p.designCapacity ? Number(p.designCapacity) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await nepReq(this.username, this.password, "/PowerStation/realTimeData", { stationId: externalId });
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.currentPower ?? 0),
      todayKwh: Number(d.dayEnergy ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.totalEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await nepReq(this.username, this.password, "/PowerStation/devices", { stationId: externalId });
    const list = data?.data ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.deviceId),
      model: d.modelName ? String(d.modelName) : undefined,
      status: String(d.status ?? ""),
      currentKw: Number(d.currentPower ?? 0),
    }));
  }
}
