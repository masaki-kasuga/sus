import fs from 'fs';
import path from 'path';
import { DashboardData, WasteDetailData, ProductDetailData } from '../types/index.js';

// データのあるディレクトリのパス
const dataDir = path.join(process.cwd(), 'data');

export const loadDashboardData = (): DashboardData => {
  const filePath = path.join(dataDir, 'dashboard.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as DashboardData;
};

interface RawLineChartRecord {
  id: string;
  category_id: 'A' | 'B';
  waste_code: string;
  waste_name: string;
  recorded_at: string;
  value: number;
}

interface RawGaugeSnapshot {
  id: string;
  category_id: 'A' | 'B';
  waste_code: string;
  waste_name: string;
  percentage: number;
  recorded_at: string;
}

interface RawCalendarRecord {
  id: string;
  category_id: 'A' | 'B';
  date: string;
  day_of_week: number;
  value: number;
}

interface RawCollectionHistory {
  id: string;
  category_id: 'A' | 'B';
  item: string;
  rate: number;
}

interface RawWasteDetailData {
  line_chart_records: RawLineChartRecord[];
  gauge_snapshots: RawGaugeSnapshot[];
  calendar_heatmap: RawCalendarRecord[];
  collection_history: RawCollectionHistory[];
}

const WASTE_SERIES_ORDER = [
  '再生紙',
  '新聞紙・雑誌',
  '空き瓶',
  '複合品',
  '樹脂・ゴムくず',
  '鉄くず',
  'スプレー缶',
  '可燃物',
  'その他',
];

const sortByWasteName = (a: string, b: string) => {
  const indexA = WASTE_SERIES_ORDER.indexOf(a);
  const indexB = WASTE_SERIES_ORDER.indexOf(b);
  if (indexA === -1 && indexB === -1) {
    return a.localeCompare(b, 'ja');
  }
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
};

const buildLineChart = (records: RawLineChartRecord[]) => {
  const sortedRecords = [...records].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
  const dates = Array.from(new Set(sortedRecords.map((record) => record.recorded_at)));
  const dateIndex = new Map(dates.map((date, index) => [date, index]));
  const seriesMap = new Map<string, number[]>();

  sortedRecords.forEach((record) => {
    const idx = dateIndex.get(record.recorded_at);
    if (idx === undefined) {
      return;
    }

    if (!seriesMap.has(record.waste_name)) {
      seriesMap.set(record.waste_name, Array(dates.length).fill(0) as number[]);
    }

    const dataPoints = seriesMap.get(record.waste_name);
    if (dataPoints) {
      dataPoints[idx] = record.value;
    }
  });

  const series = Array.from(seriesMap.entries())
    .sort(([aName], [bName]) => sortByWasteName(aName, bName))
    .map(([name, data]) => ({ name, data }));

  return { dates, series };
};

export const loadWasteDetailData = (category: 'A' | 'B'): WasteDetailData => {
  const filePath = path.join(dataDir, 'waste_detail.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(data) as RawWasteDetailData;

  const lineChartRecords = parsed.line_chart_records.filter(
    (record) => record.category_id === category,
  );
  const gaugeRecords = parsed.gauge_snapshots
    .filter((snapshot) => snapshot.category_id === category)
    .sort((a, b) => sortByWasteName(a.waste_name, b.waste_name));
  const calendarRecords = parsed.calendar_heatmap
    .filter((entry) => entry.category_id === category)
    .sort((a, b) => a.date.localeCompare(b.date));
  const historyRecords = parsed.collection_history.filter(
    (entry) => entry.category_id === category,
  );

  return {
    category,
    lineChart: buildLineChart(lineChartRecords),
    gauges: gaugeRecords.map((gauge) => ({
      name: gauge.waste_name,
      percentage: gauge.percentage,
    })),
    calendar: calendarRecords.map((entry) => ({
      date: entry.date,
      dayOfWeek: entry.day_of_week,
      value: entry.value,
    })),
    collectionHistory: historyRecords.map((entry) => ({
      item: entry.item,
      rate: entry.rate,
    })),
  };
};

export const loadProductDetailData = (product: 'A' | 'B'): ProductDetailData => {
  const filePath = path.join(dataDir, 'product_detail.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  const allData = JSON.parse(data) as { productA: ProductDetailData; productB: ProductDetailData };
  return allData[product === 'A' ? 'productA' : 'productB'];
};
