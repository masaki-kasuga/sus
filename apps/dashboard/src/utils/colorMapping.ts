import type { BarChartData } from '../types';

export type ChartPaletteKey =
  | 'wasteCategory'
  | 'timeSeries'
  | 'processedProductWeekly'
  | 'classifiedWasteTimeSeries';

type PaletteConfig = {
  colors: readonly string[];
  lookup?: Record<string, string>;
};

type PaletteLookupEntry = {
  color: string;
  keys: string | string[];
};

const createPaletteLookup = (entries: PaletteLookupEntry[]): Record<string, string> => {
  const lookup: Record<string, string> = {};
  entries.forEach(({ color, keys }) => {
    const normalizedKeys = Array.isArray(keys) ? keys : [keys];
    normalizedKeys.forEach((key) => {
      lookup[key] = color;
    });
  });
  return lookup;
};

const chartPalettes: Record<ChartPaletteKey, PaletteConfig> = {
  wasteCategory: {
    lookup: createPaletteLookup([
      { keys: ['recycle-paper', '再生紙'], color: '#89CCD8' },
      { keys: ['cardboard', '段ボール'], color: '#8ABCDE' },
      { keys: ['pet-bottle', 'ペットボトル'], color: '#9A8AD0' },
      { keys: ['can', '空き缶'], color: '#0284c7' },
      { keys: ['composite', '複合品'], color: '#9AA6B2' },
      { keys: ['plastic-rubber', '樹脂・ゴムくず'], color: '#66BECE' },
      { keys: ['wire-right', '配線くず 右'], color: '#2563eb' },
      { keys: ['wire-left', '配線くず 左'], color: '#4f46e5' },
      { keys: ['battery', '電池'], color: '#4F83CC' },
      { keys: ['small-electronics', '小電気部品'], color: '#7570B3' },
      { keys: ['glass', 'ガラスくず'], color: '#7B90A5' },
      { keys: ['wood', '木くず'], color: '#203a5cff' },
    ]),
    colors: ['#89CCD8', '#8ABCDE', '#9A8AD0', '#9AA6B2', '#66BECE', '#7570B3', '#4F83CC', '#7B90A5'],
  },
  timeSeries: {
    lookup: {
      再生紙: '#9AA6B2',
      '新聞紙・雑誌': '#8b5cf6',
      空き瓶: '#89CCD8',
      複合品: '#66BECE',
      '樹脂・ゴムくず': '#7570B3',
      鉄くず: '#8ABCDE',
      スプレー缶: '#7c3aed',
      可燃物: '#3b82f6',
    },
    colors: ['#9AA6B2', '#8b5cf6', '#7570B3', '#89CCD8', '#66BECE', '#3b82f6', '#8ABCDE', '#c084fc'],
  },
  processedProductWeekly: {
    lookup: {
      加工品A重量計: '#2eb28f', // I-K3材加不(Assy)
      加工品B重量計: '#5b6bc6', // I-K3材加不(単品)
    },
    colors: ['#2eb28f', '#5b6bc6', '#f59e0b', '#94a3b8', '#1f2937'],
  },
  classifiedWasteTimeSeries: {
    lookup: {
      再生紙: '#89CCD8',
      '新聞紙・雑誌': '#8ABCDE',
      空き瓶: '#9A8AD0',
      複合品: '#9AA6B2',
      '樹脂・ゴムくず': '#66BECE',
      鉄くず: '#7570B3',
      スプレー缶: '#4F83CC',
      可燃物: '#f43f5e',
    },
    colors: ['#89CCD8', '#8ABCDE', '#9A8AD0', '#9AA6B2', '#66BECE', '#7570B3', '#4F83CC', '#f43f5e'],
  },
};

const FALLBACK_COLOR = '#94a3b8';

interface ResolveColorOptions {
  code?: string;
}

const resolveColorFromPalette = (
  seriesName: string,
  index: number,
  paletteKey: ChartPaletteKey,
  options?: ResolveColorOptions,
) => {
  const palette = chartPalettes[paletteKey];
  const lookupKeys = [options?.code, seriesName].filter(Boolean) as string[];
  for (const key of lookupKeys) {
    const explicit = key ? palette.lookup?.[key] : undefined;
    if (explicit) {
      return explicit;
    }
  }
  const fallbackColors = palette.colors;
  if (!fallbackColors.length) {
    return FALLBACK_COLOR;
  }
  return fallbackColors[index % fallbackColors.length];
};

export const getSeriesColor = (seriesName: string, index = 0) =>
  resolveColorFromPalette(seriesName, index, 'wasteCategory');

export const getTimeSeriesColor = (
  seriesName: string,
  index = 0,
  paletteKey: ChartPaletteKey = 'timeSeries',
  options?: ResolveColorOptions,
) => resolveColorFromPalette(seriesName, index, paletteKey, options);

export const PRODUCT_WEEKLY_BAR_PALETTE: ChartPaletteKey = 'processedProductWeekly';
export const CLASSIFIED_WASTE_TIME_SERIES_PALETTE: ChartPaletteKey = 'classifiedWasteTimeSeries';

type NamedSeries = { name: string; color?: string };

const applyPaletteToNamedSeries = <T extends NamedSeries>(series: T[], paletteKey: ChartPaletteKey): T[] =>
  series.map((entry, index) => ({
    ...entry,
    // Always apply palette color, ignore existing color to ensure consistent styling
    color: resolveColorFromPalette(entry.name, index, paletteKey),
  }));

// Mapping from internal series names to display names
const SERIES_NAME_MAPPING: Record<string, string> = {
  加工品A重量計: 'I-K3材加不(Assy)',
  加工品B重量計: 'I-K3材加不(単品)',
};

export const applyPaletteToBarChart = (
  barChart: BarChartData,
  paletteKey: ChartPaletteKey,
): BarChartData => {
  if (!barChart.series?.length) {
    return barChart;
  }
  
  // Apply palette and map series names for display
  const mappedSeries = applyPaletteToNamedSeries(barChart.series, paletteKey).map((entry) => ({
    ...entry,
    name: SERIES_NAME_MAPPING[entry.name] ?? entry.name,
  }));
  
  return {
    ...barChart,
    series: mappedSeries,
  };
};

export const applyPaletteToTimeSeries = <T extends NamedSeries>(
  series: T[],
  paletteKey: ChartPaletteKey,
): T[] => applyPaletteToNamedSeries(series, paletteKey);
