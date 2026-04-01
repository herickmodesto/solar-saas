// ─── Shared types for all monitoring adapters ───────────────────────────────

export interface PlantStats {
  currentKw: number;
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  totalKwh: number;
}

export interface ExternalPlant {
  externalId: string;
  name: string;
  nominalPower?: number;
  city?: string;
  status?: string;
}

export interface ExternalDevice {
  serialNumber: string;
  model?: string;
  status?: string;
  currentKw: number;
}

export interface ExternalAlert {
  message: string;
  deviceSn?: string;
  alertType: "FAULT" | "WARNING" | "INFO";
  occurredAt: Date;
}

export interface MonitoringAdapter {
  getPlantList(): Promise<ExternalPlant[]>;
  getPlantStats(externalId: string): Promise<PlantStats>;
  getPlantAlerts(externalId: string, date?: string): Promise<ExternalAlert[]>;
  getDevices(externalId: string): Promise<ExternalDevice[]>;
}
