import type { MonitoringAdapter, PlantStats, ExternalPlant, ExternalDevice, ExternalAlert } from "./types";
import crypto from "crypto";

interface SolisCredentials {
  apiKey: string;
  apiSecret: string;
  serverUrl?: string;
}

function solisSign(method: string, contentMd5: string, contentType: string, date: string, path: string, secret: string): string {
  const payload = [method, contentMd5, contentType, date, path].join("\n");
  return crypto.createHmac("sha1", secret).update(payload).digest("base64");
}

async function solisRequest(creds: SolisCredentials, path: string, body: Record<string, unknown>) {
  const base = creds.serverUrl ?? "https://www.soliscloud.com:13333";
  const date = new Date().toUTCString();
  const bodyStr = JSON.stringify(body);
  const contentMd5 = crypto.createHash("md5").update(bodyStr).digest("base64");
  const contentType = "application/json;charset=UTF-8";
  const sign = solisSign("POST", contentMd5, contentType, date, path, creds.apiSecret);

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      "Content-MD5": contentMd5,
      Date: date,
      Authorization: `API ${creds.apiKey}:${sign}`,
    },
    body: bodyStr,
  });
  if (!res.ok) throw new Error(`Solis API error ${res.status}`);
  return res.json();
}

export class SolisAdapter implements MonitoringAdapter {
  private creds: SolisCredentials;

  constructor(apiKey: string, apiSecret: string, serverUrl?: string) {
    this.creds = { apiKey, apiSecret, serverUrl };
  }

  async getPlantList(): Promise<ExternalPlant[]> {
    const data = await solisRequest(this.creds, "/v1/api/userStationList", { pageNo: 1, pageSize: 100 });
    const stations = data?.data?.page?.records ?? [];
    return stations.map((s: Record<string, unknown>) => ({
      externalId: String(s.id),
      name: String(s.stationName ?? s.id),
      nominalPower: s.capacity ? Number(s.capacity) : undefined,
      city: s.city ? String(s.city) : undefined,
    }));
  }

  async getPlantStats(externalId: string): Promise<PlantStats> {
    const data = await solisRequest(this.creds, "/v1/api/stationDetail", { id: externalId });
    const d = data?.data ?? {};
    return {
      currentKw: Number(d.pac ?? 0) / 1000,
      todayKwh: Number(d.dayEnergy ?? 0),
      monthKwh: Number(d.monthEnergy ?? 0),
      yearKwh: Number(d.yearEnergy ?? 0),
      totalKwh: Number(d.allEnergy ?? 0),
    };
  }

  async getPlantAlerts(_externalId: string): Promise<ExternalAlert[]> {
    return [];
  }

  async getDevices(externalId: string): Promise<ExternalDevice[]> {
    const data = await solisRequest(this.creds, "/v1/api/inverterList", { stationId: externalId, pageNo: 1, pageSize: 50 });
    const records = data?.data?.page?.records ?? [];
    return records.map((d: Record<string, unknown>) => ({
      serialNumber: String(d.sn ?? d.id),
      model: d.model ? String(d.model) : undefined,
      status: String(d.state ?? ""),
      currentKw: Number(d.pac ?? 0) / 1000,
    }));
  }
}
