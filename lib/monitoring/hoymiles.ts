import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

const BASE = "https://global.hoymiles.com/platform/api/gateway";

let _token: string | null = null;
let _tokenAt = 0;
const TOKEN_TTL = 3600 * 1000;

async function getToken(username: string, password: string): Promise<string> {
  if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
  const body = { body: { user_name: username, password }, systemTps: Date.now(), appSecret: "IAmASecretForHoymiles" };
  const res = await fetch(`${BASE}/iam/auth_login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data?.status !== "0") throw new Error(`Hoymiles auth error: ${data?.message ?? res.status}`);
  _token = data?.data?.token ?? "";
  _tokenAt = Date.now();
  return _token!;
}

async function hmRequest(username: string, password: string, path: string, body: Record<string, unknown>) {
  const token = await getToken(username, password);
  const payload = { body, systemTps: Date.now(), appSecret: "IAmASecretForHoymiles" };
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "cookie": `hm_token=${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Hoymiles API error ${res.status}`);
  return res.json();
}

export class HoymileesAdapter implements MonitoringAdapter {
  constructor(private username: string, private password: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await hmRequest(this.username, this.password, "/pvm/station_select_by_page", { page: { pageIndex: 1, pageSize: 100 } });
    const list = data?.data?.list ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.id),
      name: String(p.name ?? p.id),
      nominalPower: p.capacity ? Number(p.capacity) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await hmRequest(this.username, this.password, "/pvm-data/data_count_station_real_data", { sid: Number(externalId) });
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.realPower ?? 0),
      todayKwh: Number(d.todayEnergy ?? d.today_eq ?? 0),
      monthKwh: Number(d.monthEnergy ?? d.month_eq ?? 0),
      yearKwh: Number(d.yearEnergy ?? d.year_eq ?? 0),
      totalKwh: Number(d.totalEnergy ?? d.total_eq ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await hmRequest(this.username, this.password, "/pvm/station_micro_select_by_page", {
      sid: Number(externalId), page: { pageIndex: 1, pageSize: 100 }
    });
    const list = data?.data?.list ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.id),
      model: d.model ? String(d.model) : undefined,
      status: String(d.state ?? d.status ?? ""),
      currentKw: Number(d.power ?? 0),
    }));
  }
}
