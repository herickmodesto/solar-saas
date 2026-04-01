import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

const SEMS_BASE = "https://www.semsportal.com";
const APP_KEY = "Jetkfkmfcd2tkmsm2d92kcmk2cke";

let _token: string | null = null;
let _tokenAt = 0;
const TOKEN_TTL = 1800 * 1000;

async function getToken(email: string, password: string): Promise<string> {
  if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
  const res = await fetch(`${SEMS_BASE}/api/Common/CrossLogin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Token": JSON.stringify({ version: "v2.1.0", client: "ios", language: "en" }) },
    body: JSON.stringify({ account: email, pwd: password }),
  });
  const data = await res.json();
  if (!res.ok || data?.code !== 0) throw new Error(`GoodWe/SEMS auth error: ${data?.msg ?? res.status}`);
  _token = data?.data?.token ?? "";
  _tokenAt = Date.now();
  return _token!;
}

async function semsRequest(email: string, password: string, path: string, body: Record<string, unknown>) {
  const token = await getToken(email, password);
  const res = await fetch(`${SEMS_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Token": JSON.stringify({ version: "v2.1.0", client: "ios", language: "en", uid: "", timestamp: 0, token }),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`SEMS API error ${res.status}`);
  return res.json();
}

export class GoodWeAdapter implements MonitoringAdapter {
  constructor(private email: string, private password: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await semsRequest(this.email, this.password, "/api/v2/PowerStation/GetPowerStationByUser", { page_index: 1, page_size: 100 });
    const list = data?.data?.list ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.powerstation_id ?? p.id),
      name: String(p.powerstation_name ?? p.powerstation_id),
      nominalPower: p.capacity ? Number(p.capacity) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await semsRequest(this.email, this.password, "/api/v2/PowerStation/GetPowerStationData", { powerStationId: externalId });
    const d = data?.data?.kpi ?? {};
    return {
      currentKw: Number(d.pac ?? 0),
      todayKwh: Number(d.power ?? d.day_income ?? 0),
      monthKwh: Number(d.month_generate ?? 0),
      yearKwh: Number(d.year_generate ?? 0),
      totalKwh: Number(d.total_power ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await semsRequest(this.email, this.password, "/api/v2/PowerStation/GetPowerStationData", { powerStationId: externalId });
    const inverters = data?.data?.inverter ?? [];
    return inverters.map((d: Record<string, unknown>) => {
      const full = (d.invert_full ?? {}) as Record<string, unknown>;
      return {
        serialNumber: String(full.sn ?? d.sn ?? "unknown"),
        model: full.model_type ? String(full.model_type) : undefined,
        status: String(full.status ?? d.status ?? ""),
        currentKw: Number(full.pac ?? d.pac ?? 0),
      };
    });
  }
}
