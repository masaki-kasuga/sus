import { useMemo } from 'react';
import { ResponsiveBar, type BarTooltipProps, type BarLayer } from '@nivo/bar';
import { motion } from 'framer-motion';
import type { BarChartData } from '../../types';
import { getSeriesColor } from '../../utils/colorMapping';
import './Chart.css';

interface BarChartProps {
  data: BarChartData;
  height?: number;
  color?: string;
}

const weekdayLabels = ['日', '月', '火', '水', '木', '金', '土'];

const STACK_TOP_RADIUS = 6;

const buildTopRoundedPath = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  if (r === 0) {
    return `M${x} ${y}h${width}v${height}h-${width}z`;
  }
  const right = x + width;
  const bottom = y + height;
  return [
    `M${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `H ${right - r}`,
    `Q ${right} ${y} ${right} ${y + r}`,
    `V ${bottom}`,
    `H ${x}`,
    'Z',
  ].join(' ');
};

const formatJapaneseDateLabel = (rawDate: string) => {
  const [datePart] = rawDate.split(' ');
  const delimiters = /[/.\\-]/;
  const segments = datePart.split(delimiters).map((segment) => Number(segment));
  if (segments.length === 3 && segments.every((n) => Number.isFinite(n))) {
    const [year, month, day] = segments;
    const dateObj = new Date(year, month - 1, day);
    const labelDay = dateObj.getDate();
    const weekday = weekdayLabels[dateObj.getDay()] ?? '';
    return `${labelDay}(${weekday})`;
  }
  const fallback = rawDate.includes('/') ? rawDate.split('/')[2] : rawDate;
  return fallback;
};

const BarChart = ({ data, height = 360, color = '#3b82f6' }: BarChartProps) => {
  const isStacked = Array.isArray(data.series) && data.series.length > 0;
  const fallbackValues = data.values ?? [];
  const chartData = data.dates.map((date, index) => {
    const shortLabel = formatJapaneseDateLabel(date);
    const baseEntry: Record<string, number | string> = {
      date: shortLabel,
      fullDate: date,
    };

    if (isStacked && data.series) {
      data.series.forEach((series) => {
        baseEntry[series.name] = series.values[index] ?? 0;
      });
    } else {
      baseEntry.value = fallbackValues[index] ?? 0;
    }

    return baseEntry;
  });

  const keys = isStacked && data.series ? data.series.map((series) => series.name) : ['value'];
  const colors =
    isStacked && data.series
      ? data.series.map((series, index) => series.color ?? getSeriesColor(series.name, index))
      : [color];

  const computedMaxValue = useMemo(() => {
    if (isStacked && data.series) {
      const totals = data.dates.map((_, idx) =>
        data.series!.reduce((sum, series) => sum + (series.values[idx] ?? 0), 0),
      );
      return totals.length ? Math.max(...totals) : 0;
    }
    return fallbackValues.length ? Math.max(...fallbackValues) : 0;
  }, [isStacked, data.series, data.dates, fallbackValues]);

  const yAxisMax = useMemo(() => {
    if (!Number.isFinite(computedMaxValue)) {
      return 40;
    }
    const rawMax = Math.max(10, Math.ceil(computedMaxValue / 5) * 5);
    const magnitude = 10 ** (Math.max(String(rawMax).length - 1, 0));
    const niceMax = Math.ceil(rawMax / magnitude) * magnitude;
    return niceMax;
  }, [computedMaxValue]);

  const yAxisTicks = useMemo(() => {
    if (!Number.isFinite(yAxisMax) || yAxisMax <= 0) {
      return [0, 10, 20, 30, 40];
    }
    const step = yAxisMax / 4;
    return [0, step, step * 2, step * 3, yAxisMax];
  }, [yAxisMax]);
  const renderTooltip = (bar: BarTooltipProps<Record<string, unknown>>) => {
    const fullDate = (bar.data.fullDate as string) ?? String(bar.indexValue);

    if (isStacked) {
      const segments = keys.map((key, idx) => ({
        key,
        color: colors[idx],
        value: Number(bar.data[key] ?? 0),
      }));
      const total = segments.reduce((sum, segment) => sum + segment.value, 0);

      return (
        <div className="modern-chart-tooltip">
          <div className="modern-chart-tooltip-date">{fullDate}</div>
          <div className="modern-chart-tooltip-total">合計: {total.toLocaleString()} kg</div>
          <div className="modern-chart-tooltip-breakdown">
            {segments.map((segment) => (
              <div key={segment.key} className="modern-chart-tooltip-row">
                <span
                  className="modern-chart-tooltip-dot"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="modern-chart-tooltip-label">{segment.key}</span>
                <span>{segment.value.toLocaleString()} kg</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const singleValue = Number(bar.data.value ?? 0);
    return (
      <div className="modern-chart-tooltip">
        <div className="modern-chart-tooltip-date">{fullDate}</div>
        <div className="modern-chart-tooltip-breakdown">
          <div className="modern-chart-tooltip-row">
            <span
              className="modern-chart-tooltip-dot"
              style={{ backgroundColor: colors[0] }}
            />
            <span className="modern-chart-tooltip-label">排出量</span>
            <span>{singleValue.toLocaleString()} kg</span>
          </div>
        </div>
      </div>
    );
  };

  const topStackKey = isStacked && keys.length > 0 ? keys[keys.length - 1] : null;

const RoundedTopLayer: BarLayer<Record<string, string | number>> | undefined =
    isStacked && topStackKey
      ? ({ bars }) => {
          const grouped = new Map<string | number, any[]>();
          bars.forEach((bar) => {
            const barAny = bar as any;
            const key = barAny?.indexValue ?? barAny?.data?.indexValue ?? barAny?.data?.id;
            if (!grouped.has(key)) {
              grouped.set(key, []);
            }
            grouped.get(key)?.push(bar);
          });

          const topBars: any[] = [];
          grouped.forEach((group) => {
            const filtered = group.filter((bar) => (bar.id ?? bar.data?.id ?? bar.dataKey) === topStackKey);
            if (!filtered.length) return;
            const topBar = filtered.reduce((prev, curr) => (curr.y < prev.y ? curr : prev));
            topBars.push(topBar);
          });

          return (
            <>
              {topBars.map((bar) => {
                const { x, y, width, height, color, borderWidth = 2, borderColor = '#ffffff' } = bar;
                if (
                  !Number.isFinite(x) ||
                  !Number.isFinite(y) ||
                  !Number.isFinite(width) ||
                  !Number.isFinite(height) ||
                  height <= 0
                ) {
                  return null;
                }
                const path = buildTopRoundedPath(x, y, width, height, STACK_TOP_RADIUS);
                return (
                  <g key={`${bar.indexValue}-${bar.id}-rounded`} pointerEvents="none">
                    <path d={path} fill={color} pointerEvents="none" />
                    {borderWidth > 0 && (
                      <path
                        d={path}
                        fill="none"
                        stroke={borderColor}
                        strokeWidth={borderWidth}
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}
            </>
          );
        }
      : undefined;

  return (
    <motion.div
      className="modern-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ height: `${height}px` }}
    >
      <ResponsiveBar
        data={chartData}
        keys={keys}
        indexBy="date"
        margin={{ top: 50, right: 50, bottom: 60, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={colors}
        groupMode={isStacked ? 'stacked' : 'grouped'}
        minValue={0}
        maxValue={yAxisMax}
        borderRadius={isStacked ? 0 : 4}
        borderWidth={isStacked ? 2 : 0}
        borderColor={isStacked ? '#ffffff' : { from: 'color', modifiers: [['darker', 1.6]] }}
        enableGridY={false}
        enableGridX={false}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: '',
          legendPosition: 'middle',
          legendOffset: 50,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          tickValues: yAxisTicks,
          format: (value) => `${value}kg`,
        }}
        enableLabel={false}
        legends={
          isStacked
            ? [
                {
                  dataFrom: 'keys',
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateY: 60,
                  itemsSpacing: 12,
                  itemWidth: 120,
                  itemHeight: 20,
                  symbolSize: 12,
                  symbolShape: 'circle',
                },
              ]
            : undefined
        }
        theme={{
          background: 'transparent',
          text: {
            fontSize: 12,
            fill: '#6b7280',
            fontFamily: 'Inter, sans-serif',
          },
          axis: {
            domain: {
              line: {
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
            },
            ticks: {
              line: {
                stroke: '#e5e7eb',
                strokeWidth: 1,
              },
              text: {
                fontSize: 11,
                fill: '#6b7280',
              },
            },
            legend: {
              text: {
                fontSize: 13,
                fill: '#374151',
                fontWeight: 600,
              },
            },
          },
          grid: {
            line: {
              stroke: '#e5e7eb',
              strokeWidth: 1,
            },
          },
          tooltip: {
            container: {
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
            },
          },
        }}
        animate={true}
        motionConfig={{
          mass: 1,
          tension: 280,
          friction: 60,
        }}
        tooltip={renderTooltip}
        layers={
          RoundedTopLayer
            ? ['grid', 'axes', 'bars', RoundedTopLayer, 'markers', 'legends', 'annotations']
            : undefined
        }
      />
    </motion.div>
  );
};

export default BarChart;