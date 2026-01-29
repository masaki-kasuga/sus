import { createRef, useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchProductDetail } from '../services/api';
import { ProductDetailData, type BarChartData } from '../types';
import GraphCard from '../components/common/GraphCard';
import GraphCardGroup from '../components/common/GraphCardGroup';
import Loading from '../components/common/Loading';
import BarChart from '../components/charts/BarChart';
import AreaChart from '../components/charts/AreaChart';
import GradientBubbleCalendar from '../components/charts/GradientBubbleCalendar';
import { applyPaletteToBarChart, PRODUCT_WEEKLY_BAR_PALETTE } from '../utils/colorMapping';
import { useSectionNavigation } from '../hooks/useSectionNavigation';
import './ProcessedProductPage.css';

const PRODUCT_NAMES: Record<'A' | 'B', string> = {
  A: 'I-K3材加不(Assy)',
  B: 'I-K3材加不(単品)',
} as const;

const colorScheme = {
  A: { bar: '#2eb28f', area: '#2eb28f' },
  B: { bar: '#5b6bc6', area: '#5b6bc6' },
} as const;

const ProcessedProductPage = () => {
  const { product } = useParams<{ product?: 'A' | 'B' }>();
  const location = useLocation();
  const [dataA, setDataA] = useState<ProductDetailData | null>(null);
  const [dataB, setDataB] = useState<ProductDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useMemo(
    () => ({
      A: createRef<HTMLDivElement>(),
      B: createRef<HTMLDivElement>(),
    }),
    [],
  );

  const hashProduct = useMemo<'A' | 'B' | null>(() => {
    const normalized = location.hash?.toLowerCase();
    if (!normalized) return null;
    if (normalized === '#a' || normalized === '#product-a') {
      return 'A';
    }
    if (normalized === '#b' || normalized === '#product-b') {
      return 'B';
    }
    return null;
  }, [location.hash]);
  const routeProduct: 'A' | 'B' | null = product === 'A' || product === 'B' ? product : null;
  const activeProduct = hashProduct ?? routeProduct ?? 'A';

  useSectionNavigation<'A' | 'B'>({
    sectionRefs,
    activeSection: activeProduct,
    loading,
  });

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [productDataA, productDataB] = await Promise.all([
          fetchProductDetail('A'),
          fetchProductDetail('B'),
        ]);
        setDataA(productDataA);
        setDataB(productDataB);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const getWeeklyBarData = (data: ProductDetailData): BarChartData => {
    if (data.smallBarChart?.series?.length) {
      return data.smallBarChart;
    }
    return data.smallBarChart ?? data.dailyBarChart;
  };

  const normalizeDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day).getTime();
  };

  const getDayOfWeekFromDate = (dateStr: string): number => {
    const [year, month, day] = dateStr.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  };

  const buildCombinedCalendar = (a: ProductDetailData, b: ProductDetailData) => {
    const combined = new Map<string, { value: number; dayOfWeek: number }>();
    [a.calendar, b.calendar].forEach((calendar) => {
      calendar.forEach(({ date, value }) => {
        const current = combined.get(date);
        // Calculate actual day of week from date string to match bar chart
        const actualDayOfWeek = getDayOfWeekFromDate(date);
        if (current) {
          current.value += value;
        } else {
          combined.set(date, { value, dayOfWeek: actualDayOfWeek });
        }
      });
    });

    return Array.from(combined.entries())
      .sort((a, bEntry) => normalizeDate(a[0]) - normalizeDate(bEntry[0]))
      .map(([date, payload]) => ({
        date,
        dayOfWeek: payload.dayOfWeek,
        value: payload.value,
      }));
  };

  const combinedWeeklyData = useMemo(() => (dataA ? getWeeklyBarData(dataA) : null), [dataA]);
  const weeklyBarChartData = useMemo(() => {
    if (!combinedWeeklyData) return null;
    // Keep the stacked weekly chart colors centralized in utils/colorMapping.ts.
    return applyPaletteToBarChart(combinedWeeklyData, PRODUCT_WEEKLY_BAR_PALETTE);
  }, [combinedWeeklyData]);
  const combinedCalendarData = useMemo(
    () => (dataA && dataB ? buildCombinedCalendar(dataA, dataB) : []),
    [dataA, dataB],
  );

  const getDateRangeLabel = (dates: string[]) => {
    if (!dates.length) return null;
    const start = dates[0];
    const end = dates[dates.length - 1];
    return `(期間: ${start} ~ ${end})`;
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="error-message">エラー: {error}</div>;
  }

  if (!dataA || !dataB || !combinedWeeklyData || !weeklyBarChartData) {
    return <div className="error-message">データがありません</div>;
  }

  return (
    <div className="product-detail-page">
      <div className="graph-section-heading">加工品計測データ</div>

      <div className="product-section" ref={sectionRefs.A}>
        <GraphCardGroup
          heading={PRODUCT_NAMES.A}
          cards={[
            {
              title: '1日あたりの排出量',
              meta: getDateRangeLabel(dataA.dailyBarChart.dates),
              content: (
                <BarChart
                  data={dataA.dailyBarChart}
                  height={360}
                  color={colorScheme.A.bar}
                />
              ),
            },
            {
              title: '排出量累計',
              meta: getDateRangeLabel(dataA.cumulativeAreaChart.dates),
              content: (
                <AreaChart
                  data={dataA.cumulativeAreaChart}
                  height={360}
                  color={colorScheme.A.area}
                />
              ),
            },
          ]}
        />
      </div>

      <div className="product-section" ref={sectionRefs.B}>
        <GraphCardGroup
          heading={PRODUCT_NAMES.B}
          cards={[
            {
              title: '1日あたりの排出量',
              meta: getDateRangeLabel(dataB.dailyBarChart.dates),
              content: (
                <BarChart
                  data={dataB.dailyBarChart}
                  height={360}
                  color={colorScheme.B.bar}
                />
              ),
            },
            {
              title: '排出量累計',
              meta: getDateRangeLabel(dataB.cumulativeAreaChart.dates),
              content: (
                <AreaChart
                  data={dataB.cumulativeAreaChart}
                  height={360}
                  color={colorScheme.B.area}
                />
              ),
            },
          ]}
        />
      </div>

      <div className="product-calendar-layout">
        <div className="product-calendar-column">
          <GraphCard
            className="product-calendar-card"
            heading="週でみる加工品排出状況"
            title="1日あたりの排出量"
            meta={getDateRangeLabel(weeklyBarChartData?.dates ?? [])}
          >
            <BarChart data={weeklyBarChartData} height={360} />
          </GraphCard>
        </div>
        <div className="product-calendar-column">
          <GraphCard
            className="product-calendar-card"
            heading=""
            title=""
            meta=""
          >
            <GradientBubbleCalendar
              data={combinedCalendarData}
              animationKey="processed-combined"
              colorScheme="green"
              unit="kg"
            />
          </GraphCard>
        </div>
      </div>
    </div>
  );
};

export default ProcessedProductPage;