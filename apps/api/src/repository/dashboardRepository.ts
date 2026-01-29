import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  DeviceConfigForDashboard,
  SensorDeviceConfigDataForDashboard,
  PlaceConfigDataForDashboard,
  MarkerDataForDashboard,
  LatestReadingRow
} from "../types/index.js";
import { pool } from "../db/pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadLatestPerDevice(targetTime: Date): Promise<LatestReadingRow[]> {
  const sql = `
    SELECT DISTINCT ON (sensor_id)
      sensor_id AS device_name,
      sensor_type,
      measured_at AS time,
      reading_value,
      voltage,
      unit,
      raspberrypi_id
    FROM wm.sensor_readings
    WHERE measured_at <= $1::timestamptz
      AND sensor_type IN ('distance', 'weight')
    ORDER BY sensor_id, measured_at DESC
  `;

  const { rows } = await pool.query<LatestReadingRow>(sql, [targetTime]);
  return rows;
}

let cachedConfig: DeviceConfigForDashboard | null = null;

export function loadDeviceConfig(): DeviceConfigForDashboard {
  if (cachedConfig) return cachedConfig;

  const filePath = path.resolve(__dirname, "../../data/dashboard_config.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const json: unknown = JSON.parse(raw);

  const config = parseDashboardConfig(json);
  cachedConfig = config;
  return config;
}

function parseDashboardConfig(json: unknown): DeviceConfigForDashboard {
  if (!isObject(json)) throw new Error("Invalid dashboard config root: not an object");

  const sensorsRaw = (json as Record<string, unknown>)["sensors"];
  const placesRaw = (json as Record<string, unknown>)["places"];
  const markersRaw = (json as Record<string, unknown>)["markers"];

  if (!Array.isArray(sensorsRaw)) throw new Error("Invalid dashboard config: sensors must be array");
  if (!Array.isArray(placesRaw)) throw new Error("Invalid dashboard config: places must be array");
  if (!Array.isArray(markersRaw)) throw new Error("Invalid dashboard config: markers must be array");

  const sensors = sensorsRaw.map(parseDevice);
  const places = placesRaw.map(parsePlace);
  const markers = markersRaw.map(parseMarker);

  return { sensors, places, markers };
}

function parseDevice(d: unknown): SensorDeviceConfigDataForDashboard {
  if (!isObject(d)) throw new Error("Invalid device config: not an object");

  const name = d["name"];
  const display_name = d["display_name"];
  const place_name = d["place_name"];
  const display_order = d["display_order"];
  const category = d["category"];

  if (
    typeof name !== "string" ||
    typeof display_name !== "string" ||
    typeof place_name !== "string" ||
    typeof display_order !== "number" ||
    typeof category !== "string"
  ) {
    throw new Error("Invalid device config");
  }

  return { name, display_name, place_name, display_order, category };
}

function parsePlace(p: unknown): PlaceConfigDataForDashboard {
  if (!isObject(p)) throw new Error("Invalid place config: not an object");

  const name = p["name"];
  const display_name = p["display_name"];
  const type = p["type"];
  const pathValue = p["path"];
  const marker_name = p["marker_name"];

  if (
    typeof name !== "string" ||
    typeof display_name !== "string" ||
    (type !== "waste" && type !== "product") ||
    typeof pathValue !== "string" ||
    typeof marker_name !== "string"
  ) {
    throw new Error("Invalid place config");
  }

  return { name, display_name, type, path: pathValue, marker_name };
}

function parseMarker(m: unknown): MarkerDataForDashboard {
  if (!isObject(m)) throw new Error("Invalid marker config: not an object");

  const name = m["name"];
  const x = m["x"];
  const y = m["y"];

  if (typeof name !== "string" || typeof x !== "number" || typeof y !== "number") {
    throw new Error("Invalid marker config");
  }

  return { name, x, y };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
