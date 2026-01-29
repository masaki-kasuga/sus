import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  TooltipProps,
  DotProps,
} from 'recharts';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import DateTimeRangePicker from './DateTimeRangePicker';
import { getTimeSeriesColor, type ChartPaletteKey } from '../../utils/colorMapping';
import './Chart.css';

const CHART_MARGIN = { top: 28, right: 28, bottom: 60, left: 32 };

const padTimePart = (value: string) => value.padStart(2, '0');

const splitTimestamp = (timestamp: string) => {
  const [datePart = '', timePart = '00:00'] = timestamp.trim().split(' ');
  return { datePart, timePart };
};

const timestampToInputValue = (timestamp: string) => {
  const { datePart, timePart } = splitTimestamp(timestamp);
  const [hours = '00', minutes = '00', seconds = '00'] = timePart.split(':');
  return `${datePart.replace(/\//g, '-')} ${padTimePart(hours)}:${padTimePart(minutes)}:${padTimePart(seconds)}`;
};

const inputToTimestamp = (datePart: string, timePart: string) => {
  const [hours = '00', minutes = '00'] = timePart.split(':');
  return `${datePart.replace(/-/g, '/')} ${padTimePart(hours)}:${padTimePart(minutes)}`;
};

const getDateInputFromTimestamp = (timestamp: string) => {
  const { datePart } = splitTimestamp(timestamp);
  return datePart.replace(/\//g, '-');
};

const parseTimestampToDate = (timestamp: string): Date => {
  const { datePart, timePart } = splitTimestamp(timestamp);
  const [yearStr = '1970', monthStr = '01', dayStr = '01'] = datePart.split('/');
  const [hoursStr = '00', minutesStr = '00', secondsStr = '00'] = timePart.split(':');
  return new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    Number(hoursStr),
    Number(minutesStr),
    Number(secondsStr),
  );
};

interface TimeSeriesLineChartProps {
  data: {
    dates: string[];
    series: {
      name: string;
      code?: string;
      data: number[];
      color?: string;
    }[];
  };
  height?: number;
  onCurrentIndexChange?: (index: number) => void;
  onCurrentLabelChange?: (label: string) => void;
  paletteKey?: ChartPaletteKey;
}

const LINE_STROKE_WIDTH = 1;
const ACTIVE_DOT_OUTER_RADIUS = 2;
const ACTIVE_DOT_INNER_RADIUS = 1;

const TimeSeriesLineChart = ({
  data,
  height = 420,
  onCurrentIndexChange,
  onCurrentLabelChange,
  paletteKey = 'timeSeries',
}: TimeSeriesLineChartProps) => {
  const initialStartTimestamp = data.dates[0];
  const initialEndTimestamp = data.dates[data.dates.length - 1];
  const [startDate, setStartDate] = useState<string>(initialStartTimestamp);
  const [endDate, setEndDate] = useState<string>(initialEndTimestamp);
  const [startDateTime, setStartDateTime] = useState<string>(timestampToInputValue(initialStartTimestamp));
  const [endDateTime, setEndDateTime] = useState<string>(timestampToInputValue(initialEndTimestamp));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // 初期状態は停止
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({});

  // 日付をDateオブジェクトに変換して比較
  const parseDate = (dateStr: string): Date => {
    return parseTimestampToDate(dateStr);
  };

  // 曜日を取得（0=日, 1=月, ..., 6=土）
  const getDayOfWeek = (dateStr: string): string => {
    const date = parseDate(dateStr);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  // X軸のラベルをフォーマット（日(曜日)）
  const formatXAxisLabel = (value: string): string => {
    const dateObj = parseTimestampToDate(value);
    const day = dateObj.getDate();
    const dayOfWeek = getDayOfWeek(value);
    return `${day}(${dayOfWeek})`;
  };

  // 期間内のデータをフィルタリング
  const filteredDates = useMemo(() => {
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    return data.dates.filter((date) => {
      const dateObj = parseDate(date);
      return dateObj >= start && dateObj <= end;
    });
  }, [data.dates, startDate, endDate]);

  const dailyTickValues = useMemo(() => {
    const seen = new Set<string>();
    return filteredDates.filter((timestamp) => {
      const { datePart } = splitTimestamp(timestamp);
      if (seen.has(datePart)) {
        return false;
      }
      seen.add(datePart);
      return true;
    });
  }, [filteredDates]);

  const startIndex = filteredDates.length > 0 ? data.dates.indexOf(filteredDates[0]) : 0;

  useEffect(() => {
    setVisibleSeries((prev) => {
      const next = { ...prev };
      data.series.forEach((series) => {
        if (next[series.name] === undefined) {
          next[series.name] = true;
        }
      });
      // remove old keys
      Object.keys(next).forEach((key) => {
        if (!data.series.some((series) => series.name === key)) {
          delete next[key];
        }
      });
      return next;
    });
  }, [data.series]);

  const filteredChartData = useMemo(
    () =>
      data.series.map((series, seriesIndex) => {
        const resolvedColor =
          series.color ??
          getTimeSeriesColor(series.name, seriesIndex, paletteKey, { code: series.code });
        return {
          id: series.name,
          code: series.code,
          color: resolvedColor,
          data: filteredDates.map((date) => {
            const originalIdx = data.dates.indexOf(date);
            return {
              x: date,
              y: series.data[originalIdx],
              originalIndex: originalIdx,
            };
          }),
        };
      }),
    [data.series, data.dates, filteredDates, paletteKey],
  );

  const chartRows = useMemo(() => {
    return filteredDates.map((timestamp, idx) => {
      const row: Record<string, any> = {
        timestamp,
        label: formatXAxisLabel(timestamp),
      };
      filteredChartData.forEach((series) => {
        row[series.id as string] =
          typeof series.data[idx]?.y === 'number'
            ? series.data[idx]?.y
            : series.data[idx]?.y !== undefined && series.data[idx]?.y !== null
            ? Number(series.data[idx]?.y)
            : null;
      });
      return row;
    });
  }, [filteredChartData, filteredDates]);

  const collectionMarkerValues = useMemo(() => {
    if (!filteredChartData.length) return [];
    
    const allCollectionEvents: Array<{
      timestamp: string;
      dropAmount: number;
      droppedToZero: boolean;
      time: number;
    }> = [];
    
    filteredChartData.forEach((series) => {
      series.data.forEach((point, idx) => {
        // Skip first point as we need previous value to compare
        if (idx === 0) return;
        
        const prevPoint = series.data[idx - 1];
        if (!prevPoint) return;
        
        const timestamp = String(point.x);
        const prevValue = typeof prevPoint.y === 'number' ? prevPoint.y : Number(prevPoint.y) ?? 0;
        const currentValue = typeof point.y === 'number' ? point.y : Number(point.y) ?? 0;
        
        if (prevValue > 0 && currentValue < prevValue) {
          const dropAmount = prevValue - currentValue;
          const dropPercentage = (dropAmount / prevValue) * 100;
          const droppedToZero = currentValue === 0 && prevValue >= 10; // Only detect 0 drop if prev >= 10
          const isLargeDrop = dropPercentage >= 25 && dropAmount >= 10; // Both conditions must be met
          
          if (droppedToZero || isLargeDrop) {
            allCollectionEvents.push({
              timestamp,
              dropAmount,
              droppedToZero,
              time: parseTimestampToDate(timestamp).getTime(),
            });
          }
        }
      });
    });
    
    allCollectionEvents.sort((a, b) => a.time - b.time);
    
    const MIN_HOURS_BETWEEN_MARKERS = 6;
    const filteredMarkers: typeof allCollectionEvents = [];
    
    allCollectionEvents.forEach((marker) => {
      const existingCloseMarker = filteredMarkers.find(
        (existing) =>
          Math.abs(marker.time - existing.time) < MIN_HOURS_BETWEEN_MARKERS * 60 * 60 * 1000
      );
      
      if (!existingCloseMarker) {
        // No close marker, add this one
        filteredMarkers.push(marker);
      } else {

        const shouldReplace =
          (marker.droppedToZero && !existingCloseMarker.droppedToZero) ||
          (marker.dropAmount > existingCloseMarker.dropAmount && !existingCloseMarker.droppedToZero);
        
        if (shouldReplace) {
          const index = filteredMarkers.indexOf(existingCloseMarker);
          filteredMarkers[index] = marker;
        }
      }
    });
    
    return filteredMarkers.map((m) => m.timestamp);
  }, [filteredChartData]);

  const playbackMarkerValue = useMemo(() => {
    if (
      filteredDates.length > 0 &&
      currentIndex < filteredDates.length &&
      !(currentIndex === 0 && !isPlaying)
    ) {
      return filteredDates[currentIndex];
    }
    return null;
  }, [filteredDates, currentIndex, isPlaying]);

  // 自動再生: 縦棒カーソルが左から右へ流れる
  useEffect(() => {
    if (isPlaying && filteredDates.length > 0 && currentIndex < filteredDates.length) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= filteredDates.length) {
            // 最後まで行ったら停止
            setIsPlaying(false);
            if (onCurrentIndexChange) {
              const lastOriginalIndex = filteredChartData[0]?.data[filteredDates.length - 1]?.originalIndex ?? startIndex + filteredDates.length - 1;
              onCurrentIndexChange(lastOriginalIndex);
            }
            return filteredDates.length - 1;
          }
          const originalIndex = filteredChartData[0]?.data[next]?.originalIndex ?? startIndex + next;
          if (onCurrentIndexChange) {
            onCurrentIndexChange(originalIndex);
          }
          return next;
        });
      }, 120); // 120ms間隔で高速再生
    } else {
      // 停止時はインターバルをクリア
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, filteredDates.length, onCurrentIndexChange, startIndex, filteredChartData]);

  // 期間変更時にインデックスをリセット
  useEffect(() => {
    setCurrentIndex(0);
    if (onCurrentIndexChange) {
      onCurrentIndexChange(startIndex);
    }
  }, [startDate, endDate, startIndex, onCurrentIndexChange]);

  const formatDateForInput = (timestamp: string): string => {
    return getDateInputFromTimestamp(timestamp);
  };

  const getMinDate = (): string => {
    return formatDateForInput(data.dates[0]);
  };

  const getMaxDate = (): string => {
    return formatDateForInput(data.dates[data.dates.length - 1]);
  };

  const renderTooltipContent = ({
    active,
    label,
    payload,
  }: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length || !label) {
      return null;
    }
    const filteredPayload = payload.filter(
      (entry) => visibleSeries[entry.dataKey as string] !== false,
    );
    if (!filteredPayload.length) {
      return null;
    }
    const { datePart, timePart } = splitTimestamp(String(label));
    return (
      <div
        className="modern-chart-tooltip"
        style={{
          minWidth: 200,
          background: 'rgba(255,255,255,0.96)',
        }}
      >
        <div className="modern-chart-tooltip-date">
          {`${datePart} ${timePart}`}
        </div>
        <div className="modern-chart-tooltip-breakdown">
          {filteredPayload.map((entry) => (
            <div key={entry.dataKey as string} className="modern-chart-tooltip-row">
              <span
                className="modern-chart-tooltip-dot"
                style={{ backgroundColor: entry.color || '#94a3b8' }}
              />
              <span className="modern-chart-tooltip-label">{entry.dataKey}</span>
              <span>{entry.value ?? '--'}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 日時文字列から日付と時刻を分離
  const parseDateTime = (dateTimeStr: string): { date: string; time: string } => {
    const [date, time] = dateTimeStr.split(' ');
    return { date: date || '', time: time || '00:00:00' };
  };

  // 現在のカーソル位置に対応する日時ラベルを親へ渡す
  useEffect(() => {
    if (!onCurrentLabelChange) return;

    if (filteredDates.length === 0) {
      onCurrentLabelChange('');
      return;
    }

    const safeIndex = Math.max(0, Math.min(currentIndex, filteredDates.length - 1));
    const currentTimestamp = filteredDates[safeIndex];
    const { datePart, timePart } = splitTimestamp(currentTimestamp);
    const label = `${datePart}(${getDayOfWeek(currentTimestamp)}) ${timePart}`;
    onCurrentLabelChange(label);
  }, [currentIndex, filteredDates, onCurrentLabelChange]);

  // Apply time rangeボタンのハンドラ
  const handleApplyTimeRange = (newStartDateTime: string, newEndDateTime: string) => {
    const start = parseDateTime(newStartDateTime);
    const end = parseDateTime(newEndDateTime);
    setStartDate(inputToTimestamp(start.date, start.time));
    setEndDate(inputToTimestamp(end.date, end.time));
    setStartDateTime(newStartDateTime);
    setEndDateTime(newEndDateTime);
  };



  const effectiveChartHeight = height + 60;

  const handleToggleSeries = (id: string) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [id]: !(prev[id] !== false),
    }));
  };

  return (
    <div className="time-series-chart">
      <div className="chart-header-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative', zIndex: 10000 }}>
        <DateTimeRangePicker
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          onApply={handleApplyTimeRange}
          minDate={getMinDate()}
          maxDate={getMaxDate()}
          buttonWidth={460}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (isPlaying) {
              // 一時停止
              setIsPlaying(false);
            } else {
              // 再生
              // 最後の位置にいる場合は最初の位置に戻す
              if (currentIndex >= filteredDates.length - 1) {
                setCurrentIndex(0);
                if (onCurrentIndexChange) {
                  onCurrentIndexChange(startIndex);
                }
              }
              setIsPlaying(true);
            }
          }}
          className={`play-pause-button ${isPlaying ? 'playing' : ''}`}
        >
          {isPlaying ? (
            <>
              <Pause size={18} />
              <span>一時停止</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>再生</span>
            </>
          )}
        </motion.button>
      </div>

      <div className="chart-wrapper" style={{ position: 'relative', height: `${effectiveChartHeight}px`, zIndex: 0 }}>
        <motion.div
          className="modern-chart-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ height: `${effectiveChartHeight}px`, position: 'relative', paddingTop: '6px', paddingBottom: '26px', boxSizing: 'border-box', zIndex: 0 }}
        >
          <div style={{ height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartRows} 
                margin={CHART_MARGIN}
                onClick={(data: any) => {
                  if (!data) return;
                  
                  let clickedTimestamp: string | undefined;
                  
                  if (data.activeLabel) {
                    clickedTimestamp = data.activeLabel;
                  } else if (data.activePayload && data.activePayload.length > 0) {
                    const activeData = data.activePayload[0];
                    clickedTimestamp = activeData.payload?.timestamp;
                  }
                  
                  if (!clickedTimestamp) return;
                  
                  const clickedIndex = filteredDates.findIndex((ts) => ts === clickedTimestamp);
                  
                  if (clickedIndex >= 0) {
                    // Update current index and stop playing if active
                    setCurrentIndex(clickedIndex);
                    setIsPlaying(false);
                    
                    // Calculate original index and notify parent
                    const originalIndex = filteredChartData[0]?.data[clickedIndex]?.originalIndex ?? startIndex + clickedIndex;
                    if (onCurrentIndexChange) {
                      onCurrentIndexChange(originalIndex);
                    }
                    
                    // Update label if callback exists
                    if (onCurrentLabelChange) {
                      onCurrentLabelChange(formatXAxisLabel(clickedTimestamp));
                    }
                  }
                }}
              >
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  ticks={dailyTickValues}
                  tickFormatter={(value) => formatXAxisLabel(String(value))}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  height={40}
                  padding={{ left: 0, right: 0 }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(value) => `${value}%`}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  width={48}
                />
                {collectionMarkerValues.map((timestamp, index) => {

                  const offsetY = index % 2 === 0 ? -18 : -36;
                  
                  return (
                    <ReferenceLine
                      key={`collection-${timestamp}`}
                      x={timestamp}
                      stroke="#38bdf8"
                      strokeDasharray="6 4"
                      strokeWidth={1.5}
                      label={{
                        value: '回収',
                        position: 'top',
                        fill: '#1d4ed8',
                        fontSize: 10,
                        fontWeight: 700,
                        offset: offsetY,
                      }}
                    />
                  );
                })}
                {playbackMarkerValue && (
                  <ReferenceLine
                    x={playbackMarkerValue}
                    stroke="#4b5563"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                )}
                <Tooltip
                  content={renderTooltipContent}
                  cursor={{ stroke: 'rgba(148,163,184,0.5)', strokeWidth: 1 }}
                  wrapperStyle={{ zIndex: 10010 }}
                />
                {filteredChartData
                  .filter((series) => visibleSeries[series.id as string] !== false)
                  .map((series) => {
                    const seriesColor = (series.color as string) || '#2563eb';
                    const renderActiveDot = (dotProps: DotProps) => {
                      const { cx, cy } = dotProps;
                      if (typeof cx !== 'number' || typeof cy !== 'number') {
                        return <g />;
                      }
                      return (
                        <g>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={ACTIVE_DOT_OUTER_RADIUS}
                            fill="#fff"
                            stroke={seriesColor}
                            strokeWidth={1.6}
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r={ACTIVE_DOT_INNER_RADIUS}
                            fill={seriesColor}
                            fillOpacity={0.95}
                          />
                        </g>
                      );
                    };
                    return (
                      <Line
                        key={series.id as string}
                        type="monotone"
                        dataKey={series.id as string}
                        name={series.id as string}
                        stroke={seriesColor}
                        strokeWidth={LINE_STROKE_WIDTH}
                        strokeOpacity={0.95}
                        dot={false}
                        isAnimationActive={false}
                        connectNulls
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        activeDot={renderActiveDot}
                      />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {filteredChartData.length > 0 && (
            <div
              style={{
                position: 'absolute',
                left: 40,
                right: 20,
                bottom: 8,
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px 16px',
                alignItems: 'center',
                justifyContent: 'flex-start',
                fontSize: '13px',
                color: '#6b7280',
                background: 'rgba(255, 255, 255, 0.92)',
                padding: '8px 12px',
                borderRadius: 12,
              }}
            >
              {filteredChartData.map((series) => {
                const id = series.id as string;
                const active = visibleSeries[id] !== false;
                const baseColor = series.color as string;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleToggleSeries(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      whiteSpace: 'nowrap',
                      padding: '4px 8px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: active ? '#0f172a' : '#a1a1aa',
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: `1.5px solid ${active ? baseColor : 'rgba(148,163,184,0.7)'}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: active ? 'rgba(255,255,255,0.9)' : 'rgba(248,250,252,0.7)',
                        boxShadow: active ? `0 6px 12px ${baseColor}22` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: active ? baseColor : 'rgba(148,163,184,0.6)',
                        }}
                      />
                    </span>
                    <span>{id}</span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TimeSeriesLineChart;