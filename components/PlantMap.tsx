"use client";
import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Plant, PlantStatus } from "@/types";

const statusColor: Record<PlantStatus, string> = {
  NORMAL: "#22c55e",
  ALERT: "#f59e0b",
  CRITICAL: "#ef4444",
  UNKNOWN: "#94a3b8",
  OFFLINE: "#6b7280",
};

const statusLabel: Record<PlantStatus, string> = {
  NORMAL: "Normal",
  ALERT: "Com Alerta",
  CRITICAL: "Crítico",
  UNKNOWN: "Desconhecido",
  OFFLINE: "Offline",
};

const P = { primary: "#1B3C53", mid: "#456882" };

interface Props {
  plants: Plant[];
  onPlantClick?: (plant: Plant) => void;
}

export default function PlantMap({ plants, onPlantClick }: Props) {
  const mapped = plants.filter((p) => p.latitude != null && p.longitude != null);

  // Centro padrão: Natal - RN
  const center: [number, number] = mapped.length > 0
    ? [
        mapped.reduce((s, p) => s + p.latitude!, 0) / mapped.length,
        mapped.reduce((s, p) => s + p.longitude!, 0) / mapped.length,
      ]
    : [-5.795, -35.211];

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mapped.map((plant) => {
        const color = statusColor[plant.status];
        return (
          <CircleMarker
            key={plant.id}
            center={[plant.latitude!, plant.longitude!]}
            radius={10}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.9,
              color: "#fff",
              weight: 2,
            }}
            eventHandlers={onPlantClick ? { click: () => onPlantClick(plant) } : undefined}
          >
            <Popup>
              <div style={{ minWidth: 160, fontFamily: "sans-serif" }}>
                <p style={{ fontWeight: 700, color: P.primary, margin: "0 0 4px" }}>{plant.name}</p>
                <span style={{
                  display: "inline-block", fontSize: 11, fontWeight: 600, borderRadius: 999,
                  padding: "2px 8px", background: color + "22", color,
                }}>
                  {statusLabel[plant.status]}
                </span>
                <div style={{ marginTop: 6, fontSize: 12, color: "#555" }}>
                  {plant.systemKwp && <p style={{ margin: "2px 0" }}>⚡ {plant.systemKwp} kWp</p>}
                  {plant.city && <p style={{ margin: "2px 0" }}>📍 {plant.city}{plant.state ? ` - ${plant.state}` : ""}</p>}
                </div>
                {onPlantClick && (
                  <button
                    onClick={() => onPlantClick(plant)}
                    style={{
                      marginTop: 8, width: "100%", padding: "4px 0", fontSize: 12,
                      background: P.primary, color: "#fff", border: "none",
                      borderRadius: 6, cursor: "pointer", fontWeight: 600,
                    }}
                  >
                    Ver detalhes
                  </button>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
