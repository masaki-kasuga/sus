import {
  DashboardData,
  WeightSensorDeviceData,
  DistanceSensorDeviceData,
  SensorDeviceDataForDashboard,
  DeviceConfigForDashboard,
  Product,
  WasteCategory,
  MapMarker,
  LatestReadingRow
} from "../types/index.js";
import {
  loadLatestPerDevice,
  loadDeviceConfig,
} from "../repository/dashboardRepository.js";
import { logger } from "../utils/logger.js";

const ACTIVE_THRESHOLD_HOURS = 24;
const DISTANCE_FULL_MM = 36.5;

export const loadDashboardData = async (): Promise<DashboardData> => {
  // For testing, use a fixed target time
  const targetTime = new Date();
  // const targetTime = new Date(Date.now() + 9 * 60 * 60 * 1000); // JST
  logger.info(`Target time for latest data: ${targetTime.toISOString()}`);

  const config = safeLoadConfig();

  const rows = await safeLoadLatestRows(targetTime);

  const sensorValues = mapDbRowsToDashboardValues(rows);

  logger.info(`Active threshold hours: ${ACTIVE_THRESHOLD_HOURS}`);

  return buildDashboardJson(targetTime, config, sensorValues, ACTIVE_THRESHOLD_HOURS);
};

async function safeLoadLatestRows(targetTime: Date): Promise<LatestReadingRow[]> {
  try {
    return await loadLatestPerDevice(targetTime);
  } catch (err) {
    logger.error("Error loading data:", err);
    return [];
  }
}

function safeLoadConfig(): DeviceConfigForDashboard {
  try {
    return loadDeviceConfig();
  } catch (err) {
    logger.error("Error loading device config:", err);
    return { sensors: [], places: [], markers: [] };
  }
}

function mapDbRowsToDashboardValues(rows: LatestReadingRow[]): SensorDeviceDataForDashboard[] {
  const result: SensorDeviceDataForDashboard[] = [];

  for (const row of rows) {
    const t = new Date(row.time);
    if (Number.isNaN(t.getTime())) {
      logger.warn(`Skipping row due to invalid time: device=${row.device_name} time=${row.time}`);
      continue;
    }

    if (row.sensor_type === "distance") {
      const mm = toDistanceMm(row.reading_value, row.unit);
      if (mm == null) {
        logger.warn(`Skipping distance row due to invalid unit/value: device=${row.device_name} unit=${row.unit}`);
        continue;
      }

      const v: DistanceSensorDeviceData = {
        voltage: row.voltage ?? null,
        distance: distanceMmToPercentage(mm),
      };

      result.push({
        device_name: row.device_name,
        sensor_type: "distance",
        value: v,
        time: row.time,
      });
      continue;
    }

    if (row.sensor_type === "weight") {
      const kg = toWeightKg(row.reading_value, row.unit);
      if (kg == null) {
        logger.warn(`Skipping weight row due to invalid unit/value: device=${row.device_name} unit=${row.unit}`);
        continue;
      }

      const v: WeightSensorDeviceData = {
        voltage: row.voltage ?? null,
        weight: kg,
      };

      result.push({
        device_name: row.device_name,
        sensor_type: "weight",
        value: v,
        time: row.time,
      });
      continue;
    }
  }

  return result;
}

function distanceMmToPercentage(mm: number): number {
  const pct = (Math.max(DISTANCE_FULL_MM - mm, 0) / DISTANCE_FULL_MM) * 100;
  return Math.round(pct);
}

/**
 * DB reading_valueをmmに揃える
 * - unitがmmならそのまま
 * - 将来cm/mが来ても壊れないように最低限対応
 */
function toDistanceMm(readingValue: number, unit: string): number | null {
  const v = Number(readingValue);
  if (!Number.isFinite(v)) return null;

  if (unit === "mm") return v;
  if (unit === "cm") return v * 10;
  if (unit === "m") return v * 1000;

  // 想定外はnull（UI互換を壊さずスキップ）
  return null;
}

/**
 * DB reading_valueをkgに揃える
 */
function toWeightKg(readingValue: number, unit: string): number | null {
  const v = Number(readingValue);
  if (!Number.isFinite(v)) return null;

  if (unit === "g") return v / 1000;
  if (unit === "kg") return v;

  return null;
}

function buildDashboardJson(
  timestamp: Date,
  config: DeviceConfigForDashboard,
  sensorValues: SensorDeviceDataForDashboard[],
  active_threshold_hour: number
): DashboardData {
  const baseTime = timestamp.getTime();
  const thresholdMs = active_threshold_hour * 60 * 60 * 1000;

  const sensorValueByDevice = new Map(
    sensorValues.map((v) => [v.device_name, v] as const)
  );

  const wastePlaces = config.places.filter((p) => p.type === "waste");
  const wasteCategories = wastePlaces.map((place) => {
    const devicesAtPlace = config.sensors.filter((d) => d.place_name === place.name);

    const sensors: WasteCategory[] = devicesAtPlace.map((device) => {
      const sensorValue = sensorValueByDevice.get(device.name) ?? null;
      if (!sensorValue) {
        logger.warn(`No sensorValue for device.name=${device.name}`);
      }

      const dataTime = sensorValue ? new Date(sensorValue.time).getTime() : null;

      return {
        name: device.display_name,
        percentage: sensorValue?.sensor_type === "distance" ? sensorValue.value.distance ?? 0 : 0,
        active: sensorValue != null && dataTime != null && baseTime - dataTime <= thresholdMs,
        updatedAt: sensorValue?.time ?? null,
        display_order: device.display_order,
        category: device.category,
      };
    });

    sensors.sort((a, b) => a.display_order - b.display_order);
    return { title: place.display_name, sensors, path: place.path };
  });

  const productPlaces = config.places.filter((p) => p.type === "product");
  const products = productPlaces.map((place) => {
    const device = config.sensors.find((d) => d.place_name === place.name);
    const sensorValue = device ? sensorValueByDevice.get(device.name) ?? null : null;
    const dataTime = sensorValue ? new Date(sensorValue.time).getTime() : null;

    const product: Product = {
      name: place.display_name,
      weight: sensorValue?.sensor_type === "weight" ? Math.round(sensorValue.value.weight ?? 0) : 0,
      active: sensorValue != null && dataTime != null && baseTime - dataTime <= thresholdMs,
      updatedAt: sensorValue?.time ?? null,
      display_order: device ? device.display_order : 0,
      category: device ? device.category : "",
    };

    return { title: place.display_name, product, path: place.path };
  });

  const mapMarkers: MapMarker[] = config.markers.map((marker) => {
    const places = config.places.filter((p) => p.marker_name === marker.name);
    return {
      name: marker.name,
      x: marker.x,
      y: marker.y,
      items: places.map((place) => ({ name: place.display_name, path: place.path })),
    };
  });

  return { timestamp: timestamp.toISOString(), wasteCategories, products, mapMarkers };
}
