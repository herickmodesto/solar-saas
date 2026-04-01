import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

// Chint FlexOM API — token-based auth (API Token from portal)
const BASE = "https://flexom.chint.com/api";

export class ChintAdapter implements MonitoringAdapter {
  constructor(private apiKey: string) {}

  private async req(path: string, body?: Record<string, unknown>) {
    const res = await fetch(`${BASE}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "token": this.apiKey,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Chint FlexOM API error ${res.status}`);
    return res.json();
  }

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await this.req("/v1/station/list", { pageNo: 1, pageSize: 100 });
    const list = data?.data?.records ?? data?.data?.list ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.stationId ?? p.id),
      name: String(p.stationName ?? p.name ?? p.stationId),
      nominalPower: p.installedCapacity ? Number(p.installedCapacity) : undefined,
      city: p.address ? String(p.address) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await this.req("/v1/station/realtime", { stationId: externalId });
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.currentPower ?? d.pac ?? 0),
      todayKwh: Number(d.todayEnergy ?? d.eDay ?? 0),
      monthKwh: Number(d.monthEnergy ?? d.eMonth ?? 0),
      yearKwh: Number(d.yearEnergy ?? d.eYear ?? 0),
      totalKwh: Number(d.totalEnergy ?? d.eTotal ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await this.req("/v1/device/list", { stationId: externalId, pageNo: 1, pageSize: 50 });
    const list = data?.data?.records ?? data?.data?.list ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.deviceSn ?? d.deviceId),
      model: d.deviceModel ? String(d.deviceModel) : undefined,
      status: String(d.status ?? d.deviceStatus ?? ""),
      currentKw: Number(d.currentPower ?? d.pac ?? 0),
    }));
  }
}
