import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

// EleKeeper cloud portal (elekeeper.com) — username/password auth
const BASE = "https://www.elekeeper.com/api";

let _token: string | null = null;
let _tokenAt = 0;
const TOKEN_TTL = 3600 * 1000;

async function getToken(username: string, password: string): Promise<string> {
  if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
  const res = await fetch(`${BASE}/user/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.token) throw new Error(`EleKeeper auth error: ${data?.message ?? res.status}`);
  _token = data.data.token;
  _tokenAt = Date.now();
  return _token!;
}

async function ekReq(username: string, password: string, path: string, body?: Record<string, unknown>) {
  const token = await getToken(username, password);
  const res = await fetch(`${BASE}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", "Authorization": token },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`EleKeeper API error ${res.status}`);
  return res.json();
}

export class ElekeeperAdapter implements MonitoringAdapter {
  constructor(private username: string, private password: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await ekReq(this.username, this.password, "/plant/list", { pageNo: 1, pageSize: 100 });
    const list = data?.data?.records ?? data?.data ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.plantId ?? p.id),
      name: String(p.plantName ?? p.name ?? p.plantId),
      nominalPower: p.installedCapacity ? Number(p.installedCapacity) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await ekReq(this.username, this.password, `/plant/${externalId}/realtime`);
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.currentPower ?? d.pac ?? 0),
      todayKwh: Number(d.todayEnergy ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.totalEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await ekReq(this.username, this.password, `/plant/${externalId}/devices`);
    const list = data?.data ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.deviceSn ?? d.id),
      model: d.model ? String(d.model) : undefined,
      status: String(d.status ?? ""),
      currentKw: Number(d.currentPower ?? 0),
    }));
  }
}
