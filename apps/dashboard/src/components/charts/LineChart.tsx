import { ResponsiveLine } from '@nivo/line';
import { motion } from 'framer-motion';
import { getSeriesColor } from '../../utils/colorMapping';
import './Chart.css';

interface LineChartProps {
  data: {
    dates: string[];
    series: {
      name: string;
      data: number[];
      color?: string;
    }[];
  };
  height?: number;
  currentIndex?: number;
  isPlaying?: boolean;
}

const LineChart = ({ 
  data, 
  height = 400, 
  currentIndex = 0,
  isPlaying = false
}: LineChartProps) => {
  const chartData = data.series.map((series, seriesIndex) => {
    const resolvedColor = series.color ?? getSeriesColor(series.name, seriesIndex);
    return {
      id: series.name,
      color: resolvedColor,
      data: data.dates.map((date, index) => ({
        x: date,
        y: series.data[index],
      })),
    };
  });

  // アニメーション用のデータ（currentIndexまで）
  const animatedData =
    isPlaying && currentIndex >= 0
      ? chartData.map((series) => ({
          ...series,
          data: series.data.slice(0, currentIndex + 1),
        }))
      : chartData;

  return (
    <motion.div
      className="modern-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ height: `${height}px` }}
    >
      <ResponsiveLine
        data={animatedData}
        margin={{ top: 50, right: 110, bottom: 80, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 0,
          max: 100,
          nice: true,
        }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: '',
          legendOffset: 60,
          legendPosition: 'middle',
          format: (value) => value.split('/')[2],
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '満杯率 (%)',
          legendOffset: -50,
          legendPosition: 'middle',
          format: (value) => `${value}%`,
        }}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={true}
        areaBaselineValue={0}
        areaOpacity={0.1}
        useMesh={true}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
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
              strokeDasharray: '3 3',
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
      />
    </motion.div>
  );
};

export default LineChart;