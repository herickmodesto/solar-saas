import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

interface DeyeCredentials {
  apiKey: string;
  apiSecret: string;
  serverUrl?: string;
}

// Deye uses OAuth2 client_credentials flow
let _deyeToken: string | null = null;
let _deyeTokenAt = 0;
const TOKEN_TTL = 3600 * 1000;

async function getDeyeToken(creds: DeyeCredentials): Promise<string> {
  if (_deyeToken && Date.now() - _deyeTokenAt < TOKEN_TTL) return _deyeToken;
  const base = creds.serverUrl ?? "https://sg01eu.deyecloud.com";
  const res = await fetch(`${base}/v1.0/token?grant_type=client_credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      client_id: creds.apiKey,
      sign: creds.apiSecret,
    },
  });
  if (!res.ok) throw new Error(`Deye auth error ${res.status}`);
  const data = await res.json();
  _deyeToken = data?.result?.access_token ?? "";
  _deyeTokenAt = Date.now();
  return _deyeToken!;
}

async function deyeRequest(creds: DeyeCredentials, path: string, body?: Record<string, unknown>) {
  const base = creds.serverUrl ?? "https://sg01eu.deyecloud.com";
  const token = await getDeyeToken(creds);
  const res = await fetch(`${base}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Deye API error ${res.status}`);
  return res.json();
}

export class DeyeAdapter implements MonitoringAdapter {
  private creds: DeyeCredentials;

  constructor(apiKey: string, apiSecret: string, serverUrl?: string) {
    this.creds = { apiKey, apiSecret, serverUrl };
  }

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await deyeRequest(this.creds, "/v1.0/plants?page=1&size=100");
    const plants = data?.result?.list ?? [];
    return plants.map((p: Record<string, unknown>) => ({
      externalId: String(p.plantId ?? p.id),
      name: String(p.plantName ?? p.plantId),
      nominalPower: p.installedCapacity ? Number(p.installedCapacity) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await deyeRequest(this.creds, `/v1.0/plant/overview?plantId=${externalId}`);
    const d = data?.result ?? {};
    return {
      currentKw: Number(d.currentPower ?? 0),
      todayKwh: Number(d.todayEnergy ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.totalEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> {
    return [];
  }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await deyeRequest(this.creds, `/v1.0/plant/devices?plantId=${externalId}`);
    const devices = data?.result?.list ?? [];
    return devices.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.deviceSn ?? d.sn ?? d.id),
      model: d.deviceType ? String(d.deviceType) : undefined,
      status: String(d.status ?? ""),
      currentKw: Number(d.currentPower ?? 0),
    }));
  }
}
