import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

let _token: string | null = null;
let _tokenAt = 0;
const TOKEN_TTL = 3600 * 1000;

async function getToken(username: string, password: string, serverUrl?: string): Promise<string> {
  if (_token && Date.now() - _tokenAt < TOKEN_TTL) return _token;
  const base = serverUrl ?? "https://gateway.isolarcloud.com.hk";
  const res = await fetch(`${base}/openapi/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "sys_code": "901", "x-access-key": "93D72E60331ABDCDC7B39ADC2D1F32B3" },
    body: JSON.stringify({ user_account: username, user_password: password }),
  });
  const data = await res.json();
  if (!res.ok || !data?.result_data?.token) throw new Error(`Sungrow auth error: ${data?.result_msg ?? res.status}`);
  _token = data.result_data.token;
  _tokenAt = Date.now();
  return _token!;
}

async function sgRequest(username: string, password: string, serverUrl: string | undefined, path: string, body: Record<string, unknown>) {
  const base = serverUrl ?? "https://gateway.isolarcloud.com.hk";
  const token = await getToken(username, password, serverUrl);
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "sys_code": "901", "x-access-key": "93D72E60331ABDCDC7B39ADC2D1F32B3", "token": token },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Sungrow API error ${res.status}`);
  return res.json();
}

export class SungrowAdapter implements MonitoringAdapter {
  constructor(private username: string, private password: string, private serverUrl?: string) {}

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await sgRequest(this.username, this.password, this.serverUrl, "/openapi/getPowerStationList", { pageNo: 1, pageSize: 100 });
    const list = data?.result_data?.pageList ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.ps_id ?? p.id),
      name: String(p.ps_name ?? p.ps_id),
      nominalPower: p.design_capacity ? Number(p.design_capacity) : undefined,
      city: p.city ? String(p.city) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await sgRequest(this.username, this.password, this.serverUrl, "/openapi/getPowerStationRealKpi", { ps_id: externalId });
    const d = data?.result_data?.kpi_map ?? {};
    return {
      currentKw: Number(d.pac ?? 0) / 1000,
      todayKwh: Number(d.daily_yield ?? d.day_yield ?? 0),
      monthKwh: Number(d.month_yield ?? 0),
      yearKwh: Number(d.year_yield ?? 0),
      totalKwh: Number(d.total_yield ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await sgRequest(this.username, this.password, this.serverUrl, "/openapi/getDeviceList", { ps_id: externalId, pageNo: 1, pageSize: 50 });
    const list = data?.result_data?.pageList ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.uuid ?? d.dev_code),
      model: d.device_model_name ? String(d.device_model_name) : undefined,
      status: String(d.dev_status ?? ""),
      currentKw: Number(d.pac ?? 0) / 1000,
    }));
  }
}
