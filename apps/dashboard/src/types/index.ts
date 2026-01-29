export interface WasteLevelThreshold {
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

export interface DashboardData {
  timestamp: string;
  wasteCategories: {
    title: string;
    sensors: WasteLevelThreshold[];
    path: string;
  }[];
  products: {
    title: string;
    product: Product;
    path: string;
  }[];
  mapMarkers: MapMarker[];
}

export interface WasteDetailData {
  category: "A" | "B";
  lineChart: {
    dates: string[];
    series: {
      name: string;
      code?: string;
      data: number[];
    }[];
  };
  gauges: {
    name: string;
    code?: string;
    percentage: number;
  }[];
  calendar: {
    date: string;
    dayOfWeek: number;
    value: number;
  }[];
  collectionHistory: {
    item: string;
    code?: string;
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
