import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";

// Solplanet Pro API — HMAC-SHA256 signed requests
import { createHmac } from "crypto";

const BASE = "https://www.solplanet.net/api";

export class SolplanetAdapter implements MonitoringAdapter {
  constructor(private apiKey: string, private apiSecret: string) {}

  private sign(method: string, path: string, timestamp: number): string {
    const msg = `${method}\n${path}\n${timestamp}\n${this.apiKey}`;
    return createHmac("sha256", this.apiSecret).update(msg).digest("hex");
  }

  private async req(path: string, body?: Record<string, unknown>) {
    const timestamp = Math.floor(Date.now() / 1000);
    const method = body ? "POST" : "GET";
    const signature = this.sign(method, path, timestamp);
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "apikey": this.apiKey,
        "timestamp": String(timestamp),
        "sign": signature,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw new Error(`Solplanet API error ${res.status}`);
    return res.json();
  }

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await this.req("/v2/station/list", { page: 1, size: 100 });
    const list = data?.data?.stations ?? data?.data ?? [];
    return list.map((p: Record<string, unknown>) => ({
      externalId: String(p.stationId ?? p.id),
      name: String(p.stationName ?? p.name ?? p.stationId),
      nominalPower: p.installedPower ? Number(p.installedPower) : undefined,
      city: p.city ? String(p.city) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await this.req(`/v2/station/${externalId}/realtime`);
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.activePower ?? d.pac ?? 0),
      todayKwh: Number(d.todayEnergy ?? d.eDay ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.totalEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> { return []; }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await this.req(`/v2/station/${externalId}/devices`);
    const list = data?.data ?? [];
    return list.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.serialNumber),
      model: d.model ? String(d.model) : undefined,
      status: String(d.status ?? ""),
      currentKw: Number(d.activePower ?? d.pac ?? 0),
    }));
  }
}
