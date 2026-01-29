export interface WasteCategory {
  name: string;
  percentage: number;
  active: boolean;
  updatedAt: string | null;
  display_order: number;
  category: string;
}

export interface Product {
  name: string;
  weight: number;
  active: boolean;
  updatedAt: string | null;
  display_order: number;
  category: string;
}

export interface MapMarker {
  name: string;
  x: number;
  y: number;
  items: MarkerItem[];
}

export interface MarkerItem {
  name: string;
  path: string;
}

export type SensorDeviceDataForDashboard =
  | {
      device_name: string;
      sensor_type: "distance";
      value: DistanceSensorDeviceData;
      time: string;
    }
  | {
      device_name: string;
      sensor_type: "weight";
      value: WeightSensorDeviceData;
      time: string;
    };

export interface DeviceData {
  voltage: number | null;
}

export interface DistanceSensorDeviceData extends DeviceData {
  distance: number;
}

export interface WeightSensorDeviceData extends DeviceData {
  weight: number;
}

export interface DashboardData {
  timestamp: string;
  wasteCategories: {
    title: string;
    sensors: WasteCategory[];
    path: string;
  }[];
  products: {
    title: string;
    product: Product;
    path: string;
  }[];
  mapMarkers: MapMarker[];
}

export interface DeviceConfigForDashboard {
  sensors: SensorDeviceConfigDataForDashboard[];
  places: PlaceConfigDataForDashboard[];
  markers: MarkerDataForDashboard[];
}

export interface ConfigDataForDashboard {
  name: string;
  display_name: string;
}

export interface SensorDeviceConfigDataForDashboard
  extends ConfigDataForDashboard {
  place_name: string;
  display_order: number;
  category: string;
}

export interface PlaceConfigDataForDashboard extends ConfigDataForDashboard {
  type: "waste" | "product";
  path: string;
  marker_name: string;
}

export interface MarkerDataForDashboard {
  name: string;
  x: number;
  y: number;
}

export interface WasteDetailData {
  category: "A" | "B";
  lineChart: {
    dates: string[];
    series: {
      name: string;
      data: number[];
    }[];
  };
  gauges: {
    name: string;
    percentage: number;
  }[];
  calendar: {
    date: string;
    dayOfWeek: number;
    value: number;
  }[];
  collectionHistory: {
    item: string;
    rate: number;
  }[];
}

export interface BarChartSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface BarChartData {
  dates: string[];
  values?: number[];
  series?: BarChartSeries[];
}

export interface ProductDetailData {
  product: "A" | "B";
  dailyBarChart: {
    dates: string[];
    values: number[];
  };
  cumulativeAreaChart: {
    dates: string[];
    values: number[];
  };
  calendar: {
    date: string;
    dayOfWeek: number;
    value: number;
  }[];
  smallBarChart?: BarChartData;
}

export type LatestReadingRow = {
  device_name: string;
  sensor_type: string;
  time: string;
  reading_value: number;
  voltage: number | null;
  unit: string;
  raspberrypi_id: string;
};
