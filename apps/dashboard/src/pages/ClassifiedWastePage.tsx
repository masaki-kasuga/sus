import { createRef, MouseEvent, useEffect, useMemo, useState, useId } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { useLocation, useParams } from 'react-router-dom';
import { fetchWasteDetail } from '../services/api';
import { WasteDetailData } from '../types';
import GraphCard from '../components/common/GraphCard';
import GraphCardGroup from '../components/common/GraphCardGroup';
import Loading from '../components/common/Loading';
import TimeSeriesLineChart from '../components/charts/TimeSeriesLineChart';
import GaugeChart from '../components/charts/GaugeChart';
import GradientBubbleCalendar from '../components/charts/GradientBubbleCalendar';
import { GaugeCircle } from 'lucide-react';
import { CLASSIFIED_WASTE_TIME_SERIES_PALETTE } from '../utils/colorMapping';
import { useSectionNavigation } from '../hooks/useSectionNavigation';
import './ClassifiedWastePage.css';

type ClassifiedSectionKey = 'A' | 'B';

const CLASSIFIED_SECTION_ANCHORS: Record<ClassifiedSectionKey, string> = {
  A: 'classified-waste-card-a',
  B: 'classified-waste-card-b',
} as const;

const CLASSIFIED_WASTE_NAMES: Record<ClassifiedSectionKey, string> = {
  A: 'A-A\'6ゴミ箱',
  B: 'R-T4ゴミ箱',
} as const;

const parseTimestampToDate = (timestamp: string) => {
  const [datePart, timePart = '00:00'] = timestamp.split(' ');
  const [year, month, day] = datePart.split('/').map(Number);
  const [hours = 0, minutes = 0] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
};

const buildCalendarDataForWaste = (data: WasteDetailData, wasteName: string) => {
  if (!wasteName) {
    return [];
  }
  const series = data.lineChart.series.find((s) => s.name === wasteName);
  if (!series) return [];

  const dayMap = new Map<
    string,
    { minValue: number; maxValue: number; dayOfWeek: number }
  >();

  data.lineChart.dates.forEach((timestamp, idx) => {
    const [datePart] = timestamp.split(' ');
    const dateObj = parseTimestampToDate(timestamp);
    const value = series.data[idx] ?? 0;
    let entry = dayMap.get(datePart);
    if (!entry) {
      entry = {
        minValue: value,
        maxValue: value,
        dayOfWeek: (dateObj.getDay() + 6) % 7,
      };
      dayMap.set(datePart, entry);
    } else {
      entry.minValue = Math.min(entry.minValue, value);
      entry.maxValue = Math.max(entry.maxValue, value);
    }
  });

  return Array.from(dayMap.entries())
    .sort(
      (a, b) =>
        parseTimestampToDate(`${a[0]} 00:00`).getTime() -
        parseTimestampToDate(`${b[0]} 00:00`).getTime()
    )
    .map(([date, entry]) => ({
      date,
      dayOfWeek: entry.dayOfWeek,
      value: entry.maxValue - entry.minValue,
    }));
};

const buildCollectionEvents = (data: WasteDetailData | null) => {
  if (!data || !data.lineChart.dates.length || !data.lineChart.series.length) {
    return [];
  }

  const allCollectionEvents: Array<{
    timestamp: string;
    index: number;
    dropAmount: number;
    time: number;
  }> = [];

  data.lineChart.series.forEach((series) => {
    series.data.forEach((value, idx) => {
      if (idx === 0) return;

      const prevValue = typeof series.data[idx - 1] === 'number' ? series.data[idx - 1] : Number(series.data[idx - 1]) ?? 0;
      const currentValue = typeof value === 'number' ? value : Number(value) ?? 0;
      const timestamp = data.lineChart.dates[idx];


      if (prevValue > 0 && currentValue < prevValue) {
        const dropAmount = prevValue - currentValue;
        const dropPercentage = (dropAmount / prevValue) * 100;
        const droppedToZero = currentValue === 0 && prevValue >= 10;
        const isLargeDrop = dropPercentage >= 25 && dropAmount >= 10;

        if (droppedToZero || isLargeDrop) {
          allCollectionEvents.push({
            timestamp,
            index: idx,
            dropAmount,
            time: parseTimestampToDate(timestamp).getTime(),
          });
        }
      }
    });
  });

  allCollectionEvents.sort((a, b) => a.time - b.time);

  const MIN_HOURS_BETWEEN_EVENTS = 6;
  const filteredEvents: typeof allCollectionEvents = [];

  allCollectionEvents.forEach((event) => {
    const existingCloseEvent = filteredEvents.find(
      (existing) =>
        Math.abs(event.time - existing.time) < MIN_HOURS_BETWEEN_EVENTS * 60 * 60 * 1000
    );

    if (!existingCloseEvent) {
      filteredEvents.push(event);
    } else {
      if (event.dropAmount > existingCloseEvent.dropAmount) {
        const index = filteredEvents.indexOf(existingCloseEvent);
        filteredEvents[index] = event;
      }
    }
  });

  const events: {
    sequence: number;
    timestamp: string;
    index: number;
    snapshotIndex: number;
  }[] = [];

  filteredEvents.forEach((event, idx) => {
    const snapshotIndex = event.index > 0 ? event.index - 1 : event.index;
    events.push({
      sequence: idx + 1,
      timestamp: event.timestamp,
      index: event.index,
      snapshotIndex,
    });
  });

  return events;
};

const getAvailableWasteTabs = (data: WasteDetailData | null) => {
  if (!data?.lineChart?.series?.length) {
    return [];
  }
  return Array.from(new Set(data.lineChart.series.map((series) => series.name)));
};

const sortWasteNames = (names: string[]) => {
  return [...names].sort((a, b) => {
    return a.localeCompare(b, 'ja');
  });
};

const getGaugeValuesAtIndex = (
  data: WasteDetailData,
  index: number,
  names: string[],
) => {
  const map = new Map<string, number | undefined>();
  names.forEach((name) => {
    const series = data.lineChart.series.find((s) => s.name === name);
    const value = series?.data[index];
    map.set(name, value);
  });
  return map;
};

const formatCollectionTimestamp = (timestamp: string) => {
  const date = parseTimestampToDate(timestamp);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const [datePart, timePart = '00:00'] = timestamp.split(' ');
  return `${datePart}(${dayNames[date.getDay()]}) ${timePart}`;
};

const roundPercentageValue = (value: number | undefined | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value);
};

const formatPercentageValue = (value: number | undefined | null) => {
  const rounded = roundPercentageValue(value);
  return rounded !== null ? `${rounded}%` : '-';
};

const TAB_HIGHLIGHT_TRANSITION = {
  type: 'spring',
  stiffness: 460,
  damping: 34,
};

type DeltaDirection = 'up' | 'down' | 'flat' | 'none';

const buildDeltaState = (
  currentValue: number | undefined | null,
  previousValue: number | undefined | null,
): { text: string; direction: DeltaDirection } => {
  const currentRounded = roundPercentageValue(currentValue);
  const previousRounded = roundPercentageValue(previousValue);

  if (currentRounded === null || previousRounded === null) {
    return { text: '-', direction: 'none' };
  }

  const diff = currentRounded - previousRounded;
  if (diff === 0) {
    return { text: '±0%', direction: 'flat' };
  }

  const sign = diff > 0 ? '+' : '';
  return {
    text: `${sign}${diff}%`,
    direction: diff > 0 ? 'up' : 'down',
  };
};

const ENABLE_COLLECTION_TIMESTAMP_ANIMATION = true;
const ENABLE_COLLECTION_VALUE_ANIMATION = true;

type DeltaState = ReturnType<typeof buildDeltaState>;

const CollectionDeltaBadge = ({ delta }: { delta: DeltaState }) => {
  if (delta.direction === 'none') {
    return (
      <span className="collection-delta collection-delta--none">
        <span className="collection-delta-text">{delta.text}</span>
      </span>
    );
  }

  const iconClass =
    delta.direction === 'flat'
      ? 'collection-delta-icon collection-delta-icon--flat'
      : `collection-delta-icon collection-delta-icon--${delta.direction}`;

  return (
    <span className={`collection-delta collection-delta--${delta.direction}`}>
      <span className="collection-delta-text">{delta.text}</span>
      <span className={iconClass} aria-hidden="true" />
    </span>
  );
};

const CollectionValueDisplay = ({
  currentValue,
  delta,
  animationKey,
}: {
  currentValue: string;
  delta: DeltaState;
  animationKey: string;
}) => {
  const content = (
    <>
      <span className="collection-value-current">{currentValue}</span>
      <CollectionDeltaBadge delta={delta} />
    </>
  );

  if (!ENABLE_COLLECTION_VALUE_ANIMATION) {
    return (
      <div className="collection-value" key={animationKey}>
        {content}
      </div>
    );
  }

  return (
    <motion.div
      className="collection-value"
      key={animationKey}
      initial={{ opacity: 0, y: 12, scale: 0.92, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, scale: 0.95, filter: 'blur(4px)' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.div>
  );
};

const WasteTabSelector = ({
  options,
  selectedTab,
  onSelect,
}: {
  options: string[];
  selectedTab?: string;
  onSelect: (tab: string) => void;
}) => {
  if (!options.length) {
    return null;
  }
  const highlightGroupId = useId();
  const highlightLayoutId = `${highlightGroupId}-highlight`;
  const tabCount = Math.max(options.length, 1);
  const activeTab =
    selectedTab && options.includes(selectedTab) ? selectedTab : options[0];
  const tabsStyle = {
    '--tab-count': tabCount,
  } as React.CSSProperties;
  return (
    <LayoutGroup id={highlightGroupId}>
      <div className="waste-tabs waste-tabs--selector" style={tabsStyle}>
        {options.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              type="button"
              key={tab}
              className={`waste-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(tab)}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.span
                  layoutId={highlightLayoutId}
                  className="waste-tab-highlight"
                  transition={TAB_HIGHLIGHT_TRANSITION}
                />
              )}
              <span className="waste-tab-label">{tab}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
};

const CollectionInfoValue = ({ timestamp }: { timestamp: string | null }) => {
  const formattedValue = timestamp ? formatCollectionTimestamp(timestamp) : '---';

  if (!ENABLE_COLLECTION_TIMESTAMP_ANIMATION) {
    return <span className="collection-info-value">{formattedValue}</span>;
  }

  return (
    <motion.span
      key={formattedValue}
      className="collection-info-value collection-info-value--animated"
      initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {formattedValue}
    </motion.span>
  );
};

const ClassifiedWastePage = () => {
  const location = useLocation();
  const { category } = useParams<{ category?: 'A' | 'B' }>();
  const [dataA, setDataA] = useState<WasteDetailData | null>(null);
  const [dataB, setDataB] = useState<WasteDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndexA, setCurrentIndexA] = useState(0);
  const [currentIndexB, setCurrentIndexB] = useState(0);
  const [currentLabelA, setCurrentLabelA] = useState('');
  const [currentLabelB, setCurrentLabelB] = useState('');
  const [selectedWasteTabA, setSelectedWasteTabA] = useState<string>('');
  const [selectedWasteTabB, setSelectedWasteTabB] = useState<string>('');
  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState(0);
  const collectionTabsGroupId = useId();
  const collectionHighlightLayoutId = `${collectionTabsGroupId}-highlight`;
  const sectionRefs = useMemo(
    () => ({
      A: createRef<HTMLDivElement>(),
      B: createRef<HTMLDivElement>(),
    }),
    [],
  );

  const hashSection = useMemo<ClassifiedSectionKey | null>(() => {
    const normalized = location.hash?.toLowerCase();
    if (!normalized) return null;
    if (
      normalized === '#a' ||
      normalized === `#${CLASSIFIED_SECTION_ANCHORS.A.toLowerCase()}`
    ) {
      return 'A';
    }
    if (
      normalized === '#b' ||
      normalized === `#${CLASSIFIED_SECTION_ANCHORS.B.toLowerCase()}`
    ) {
      return 'B';
    }
    return null;
  }, [location.hash]);

  const routeSection: ClassifiedSectionKey | null =
    category === 'A' || category === 'B' ? category : null;

  const activeSection = hashSection ?? routeSection ?? 'A';

  const { scrollToSection } = useSectionNavigation<ClassifiedSectionKey>({
    sectionRefs,
    activeSection,
    loading,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [wasteDataA, wasteDataB] = await Promise.all([
          fetchWasteDetail('A'),
          fetchWasteDetail('B'),
        ]);
        setDataA(wasteDataA);
        setDataB(wasteDataB);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!category) return;
    const anchorId =
      category === 'B'
        ? CLASSIFIED_SECTION_ANCHORS.B
        : CLASSIFIED_SECTION_ANCHORS.A;
    const target = document.getElementById(anchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [category, loading]);

  const wasteTabsA = useMemo(() => getAvailableWasteTabs(dataA), [dataA]);
  const wasteTabsB = useMemo(() => getAvailableWasteTabs(dataB), [dataB]);

  useEffect(() => {
    if (!wasteTabsA.length) {
      return;
    }
    setSelectedWasteTabA((prev) => (prev && wasteTabsA.includes(prev) ? prev : wasteTabsA[0]));
  }, [wasteTabsA]);

  useEffect(() => {
    if (!wasteTabsB.length) {
      return;
    }
    setSelectedWasteTabB((prev) => (prev && wasteTabsB.includes(prev) ? prev : wasteTabsB[0]));
  }, [wasteTabsB]);

  const calendarDataA = useMemo(
    () => (dataA && selectedWasteTabA ? buildCalendarDataForWaste(dataA, selectedWasteTabA) : []),
    [dataA, selectedWasteTabA]
  );

  const calendarDataB = useMemo(
    () => (dataB && selectedWasteTabB ? buildCalendarDataForWaste(dataB, selectedWasteTabB) : []),
    [dataB, selectedWasteTabB]
  );

  const collectionEventsA = useMemo(
    () => buildCollectionEvents(dataA),
    [dataA]
  );

  const collectionEventsB = useMemo(
    () => buildCollectionEvents(dataB),
    [dataB]
  );

  const recentCollectionEvents = useMemo(() => {
    const slice = collectionEventsA.slice(-6);
    return slice.reverse();
  }, [collectionEventsA]);

  useEffect(() => {
    if (recentCollectionEvents.length > 0) {
      setSelectedCollectionIndex(0);
    }
  }, [recentCollectionEvents]);

  const selectedCollectionEvent =
    recentCollectionEvents[selectedCollectionIndex] ?? null;

  const displayCollectionTimestamp = useMemo(() => {
    if (!selectedCollectionEvent || !dataA?.lineChart?.dates?.length) {
      return null;
    }
    return (
      dataA.lineChart.dates[selectedCollectionEvent.snapshotIndex] ??
      selectedCollectionEvent.timestamp
    );
  }, [selectedCollectionEvent, dataA]);

  const collectionEventBByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildCollectionEvents>[number]>();
    collectionEventsB.forEach((event) => {
      const [datePart] = event.timestamp.split(' ');
      if (datePart) {
        map.set(datePart, event);
      }
    });
    return map;
  }, [collectionEventsB]);

  const handleHeadingAnchorClick = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionKey: ClassifiedSectionKey,
  ) => {
    event.preventDefault();
    scrollToSection(sectionKey, {
      updateHash: true,
      hash: CLASSIFIED_SECTION_ANCHORS[sectionKey],
    });
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="error-message">エラー: {error}</div>;
  }

  if (!dataA || !dataB) {
    return <div className="error-message">データがありません</div>;
  }

  const getGaugeColorByValue = (value: number) => {
    if (value < 50) return 'green';
    if (value < 75) return 'yellow';
    return 'red';
  };

  type GaugeCardData = WasteDetailData['gauges'][number] & {
    color?: 'green' | 'yellow' | 'orange' | 'red';
    hourlyValues?: { time: string; value: number; isCurrent?: boolean; isPlayed?: boolean }[];
  };

  const getCurrentGaugeValues = (
    data: WasteDetailData,
    currentIndex: number
  ): GaugeCardData[] => {
    if (!data?.lineChart?.dates?.length) {
      return [];
    }

    const safeIndex = Math.min(
      Math.max(0, currentIndex),
      data.lineChart.dates.length - 1
    );

    const targetTimestamp = data.lineChart.dates[safeIndex];
    const [targetDate] = targetTimestamp.split(' ');

    const dayEntries = data.lineChart.dates
      .map((timestamp, idx) => ({ timestamp, idx }))
      .filter(({ timestamp }) => timestamp.startsWith(targetDate));

    return data.gauges
      .filter((gauge) => gauge.name !== 'その他')
      .map((gauge) => {
        const seriesIndex = data.lineChart.series.findIndex(
          (series) => series.name === gauge.name
        );

        if (seriesIndex < 0) {
          return gauge;
        }

        const currentValue =
          data.lineChart.series[seriesIndex].data[safeIndex] ?? gauge.percentage;

        const hourlyValues = dayEntries.map(({ timestamp, idx }) => {
          const [, time = '00:00'] = timestamp.split(' ');
          const value = data.lineChart.series[seriesIndex].data[idx] ?? 0;
          return {
            time,
            value,
            isCurrent: idx === safeIndex,
            isPlayed: idx <= safeIndex,
          };
        });

        return {
          ...gauge,
          percentage: currentValue,
          color: getGaugeColorByValue(currentValue),
          hourlyValues,
        };
      });
  };

  return (
    <div className="waste-detail-page">
      {/* 期間推移グラフ + 満杯率メーター（A-A'6ゴミ箱） */}
      <div
        className="waste-section"
        id={CLASSIFIED_SECTION_ANCHORS.A}
        ref={sectionRefs.A}
      >
        <GraphCardGroup
          className="classified-graph-card-group"
          heading={
            <a
              href={`#${CLASSIFIED_SECTION_ANCHORS.A}`}
              className="classified-graph-card-heading-link"
              onClick={(event) => handleHeadingAnchorClick(event, 'A')}
            >
              <GaugeCircle size={18} strokeWidth={1.5} />
              <span>{CLASSIFIED_WASTE_NAMES.A}</span>
            </a>
          }
          cards={[
            {
              content: (
                <TimeSeriesLineChart
                  data={dataA.lineChart}
                  height={500}
                  onCurrentIndexChange={setCurrentIndexA}
                  onCurrentLabelChange={setCurrentLabelA}
                  paletteKey={CLASSIFIED_WASTE_TIME_SERIES_PALETTE}
                />
              ),
            },
            {
              title: currentLabelA || '満杯率メーター（現在値）',
              content: (
                <div className="gauges-grid">
                  {getCurrentGaugeValues(dataA, currentIndexA).map((gauge, index) => (
                    <GaugeChart
                      key={index}
                      name={gauge.name}
                      percentage={gauge.percentage}
                      color={gauge.color}
                      hourlyValues={gauge.hourlyValues}
                    />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 期間推移グラフ + 満杯率メーター（R-T4ゴミ箱） */}
      <div
        className="waste-section"
        id={CLASSIFIED_SECTION_ANCHORS.B}
        ref={sectionRefs.B}
      >
        <GraphCardGroup
          className="classified-graph-card-group"
          heading={
            <a
              href={`#${CLASSIFIED_SECTION_ANCHORS.B}`}
              className="classified-graph-card-heading-link"
              onClick={(event) => handleHeadingAnchorClick(event, 'B')}
            >
              <GaugeCircle size={18} strokeWidth={1.5} />
              <span>{CLASSIFIED_WASTE_NAMES.B}</span>
            </a>
          }
          cards={[
            {
              content: (
                <TimeSeriesLineChart
                  data={dataB.lineChart}
                  height={500}
                  onCurrentIndexChange={setCurrentIndexB}
                  onCurrentLabelChange={setCurrentLabelB}
                  paletteKey={CLASSIFIED_WASTE_TIME_SERIES_PALETTE}
                />
              ),
            },
            {
              title: currentLabelB || '満杯率メーター（現在値）',
              content: (
                <div className="gauges-grid">
                  {getCurrentGaugeValues(dataB, currentIndexB).map((gauge, index) => (
                    <GaugeChart
                      key={index}
                      name={gauge.name}
                      percentage={gauge.percentage}
                      color={gauge.color}
                      hourlyValues={gauge.hourlyValues}
                    />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="waste-section">
        <div className="calendar-layout">
          <div className="calendar-left">
            <GraphCard 
              heading="1日の中で増減したゴミ量"
              title="その日の最小値と最大値の差を示します"
            >
              <div className="bubble-charts">
                <div className="bubble-section">
                  <div className="bubble-section-header">{CLASSIFIED_WASTE_NAMES.A}</div>
                  {wasteTabsA.length > 0 && (
                    <div className="bubble-section-tab-bar">
                      <WasteTabSelector
                        options={wasteTabsA}
                        selectedTab={selectedWasteTabA}
                        onSelect={setSelectedWasteTabA}
                      />
                    </div>
                  )}
                  <GradientBubbleCalendar
                    key={`calendar-A-${selectedWasteTabA}`}
                    data={calendarDataA}
                    animationKey={`calendar-A-${selectedWasteTabA}`}
                  />
                </div>
                <div className="bubble-section">
                  <div className="bubble-section-header">{CLASSIFIED_WASTE_NAMES.B}</div>
                  {wasteTabsB.length > 0 && (
                    <div className="bubble-section-tab-bar">
                      <WasteTabSelector
                        options={wasteTabsB}
                        selectedTab={selectedWasteTabB}
                        onSelect={setSelectedWasteTabB}
                      />
                    </div>
                  )}
                  <GradientBubbleCalendar
                    key={`calendar-B-${selectedWasteTabB}`}
                    data={calendarDataB}
                    animationKey={`calendar-B-${selectedWasteTabB}`}
                  />
                </div>
              </div>
            </GraphCard>
          </div>
          <div className="calendar-right">
            <GraphCard className="collection-graph-card" heading="回収履歴">
              {recentCollectionEvents.length === 0 ? (
                <div className="collection-empty">回収データがありません</div>
              ) : (
                <>
                  <LayoutGroup id={collectionTabsGroupId}>
                    <div
                      className="waste-tabs collection-tabs waste-tabs--selector"
                      style={
                        {
                          '--tab-count': Math.max(
                            recentCollectionEvents.length,
                            1,
                          ),
                        } as React.CSSProperties
                      }
                    >
                      {recentCollectionEvents.map((event, index) => {
                        const tabOrder = recentCollectionEvents.length - index;
                        const isActive = selectedCollectionIndex === index;
                        return (
                          <button
                            type="button"
                            key={`${event.timestamp}-${event.sequence}`}
                            className={`waste-tab ${isActive ? 'active' : ''}`}
                            onClick={() => setSelectedCollectionIndex(index)}
                            aria-pressed={isActive}
                          >
                            {isActive && (
                              <motion.span
                                layoutId={collectionHighlightLayoutId}
                                className="waste-tab-highlight waste-tab-highlight--collection"
                                transition={TAB_HIGHLIGHT_TRANSITION}
                              />
                            )}
                            <span className="waste-tab-label">
                              {`${tabOrder}回目${index === 0 ? ' (最新)' : ''}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </LayoutGroup>
                  <div className="collection-info">
                    <span className="collection-info-label">回収日時</span>
                    <CollectionInfoValue timestamp={displayCollectionTimestamp} />
                  </div>
                  <div className="collection-table-wrapper collection-table-wrapper--split">
                    {(() => {
                      const gaugeNamesA = sortWasteNames(
                        dataA.gauges
                          .filter((g) => g.name !== 'その他')
                          .map((g) => g.name),
                      );
                      const gaugeNamesB = sortWasteNames(
                        dataB.gauges
                          .filter((g) => g.name !== 'その他')
                          .map((g) => g.name),
                      );
                      const datePart =
                        selectedCollectionEvent?.timestamp.split(' ')[0] ?? null;
                      const matchingCollectionEventB = datePart
                        ? collectionEventBByDate.get(datePart)
                        : null;
                      const snapshotA =
                        selectedCollectionEvent && dataA
                          ? getGaugeValuesAtIndex(
                              dataA,
                              selectedCollectionEvent.snapshotIndex,
                              gaugeNamesA,
                            )
                          : null;
                      const snapshotB =
                        matchingCollectionEventB && dataB
                          ? getGaugeValuesAtIndex(
                              dataB,
                              matchingCollectionEventB.snapshotIndex,
                              gaugeNamesB,
                            )
                          : selectedCollectionEvent && dataB
                          ? getGaugeValuesAtIndex(
                              dataB,
                              selectedCollectionEvent.snapshotIndex,
                              gaugeNamesB,
                            )
                          : null;

                      const previousCollectionEvent =
                        selectedCollectionIndex + 1 < recentCollectionEvents.length
                          ? recentCollectionEvents[selectedCollectionIndex + 1]
                          : null;
                      const previousDatePart =
                        previousCollectionEvent?.timestamp.split(' ')[0] ?? null;
                      const previousMatchingCollectionEventB = previousDatePart
                        ? collectionEventBByDate.get(previousDatePart)
                        : null;
                      const previousSnapshotA =
                        previousCollectionEvent && dataA
                          ? getGaugeValuesAtIndex(
                              dataA,
                              previousCollectionEvent.snapshotIndex,
                              gaugeNamesA,
                            )
                          : null;
                      const previousSnapshotB =
                        previousMatchingCollectionEventB && dataB
                          ? getGaugeValuesAtIndex(
                              dataB,
                              previousMatchingCollectionEventB.snapshotIndex,
                              gaugeNamesB,
                            )
                          : previousCollectionEvent && dataB
                          ? getGaugeValuesAtIndex(
                              dataB,
                              previousCollectionEvent.snapshotIndex,
                              gaugeNamesB,
                            )
                          : null;

                      const renderSideTable = (
                        title: string,
                        names: string[],
                        snapshot: Map<string, number | undefined> | null,
                        previousSnapshot: Map<string, number | undefined> | null,
                        side: 'A' | 'B',
                      ) => (
                        <table className="collection-table collection-table--split" key={side}>
                          <thead>
                            <tr>
                              <th>品目</th>
                              <th>{title}(差分)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {names.map((name) => {
                              const rawValue = snapshot?.get(name);
                              const value = formatPercentageValue(rawValue);
                              const delta = buildDeltaState(rawValue, previousSnapshot?.get(name));
                              return (
                                <tr key={`${side}-${name}`}>
                                  <td>{name}</td>
                                  <td className="collection-value-cell">
                                    <CollectionValueDisplay
                                      currentValue={value}
                                      delta={delta}
                                      animationKey={`${side}-${name}-${value}-${delta.text}-${selectedCollectionIndex}`}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      );

                      return (
                        <div className="collection-split-lists">
                          {renderSideTable(CLASSIFIED_WASTE_NAMES.A, gaugeNamesA, snapshotA, previousSnapshotA, 'A')}
                          {renderSideTable(CLASSIFIED_WASTE_NAMES.B, gaugeNamesB, snapshotB, previousSnapshotB, 'B')}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </GraphCard>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ClassifiedWastePage;