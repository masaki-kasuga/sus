import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import './Chart.css';

interface AreaChartProps {
  data: {
    dates: string[];
    values: number[];
  };
  height?: number;
  color?: string;
}

const dayOfWeekLabels = ['日', '月', '火', '水', '木', '金', '土'];

const formatXAxisLabel = (rawDate: string) => {
  const [year, month, day] = rawDate.split('/').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dow = dayOfWeekLabels[dateObj.getDay()] ?? '';
  return `${dateObj.getDate()}(${dow})`;
};

const AreaChart = ({ data, height = 360, color = '#3b82f6' }: AreaChartProps) => {
  const chartData = data.dates.map((date, index) => ({
    dateLabel: formatXAxisLabel(date),
    value: data.values[index],
  }));

  const maxValue = Math.max(...data.values, 0);
  type YAxisDomain = [number, number] | [number, 'auto'];
  const yAxisDomain: YAxisDomain = maxValue === 0 ? [0, 10] : [0, 'auto'];

  return (
    <motion.div
      className="modern-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ height: `${height}px` }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={chartData}
          margin={{ top: 8, right: 20, left: 20, bottom: 12 }}
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" opacity={0.6} vertical={false} />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            height={45}
          />
          <YAxis
            domain={yAxisDomain}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={(value: number) => `${value}kg`}
          />
          <Tooltip
            contentStyle={{
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            fill={`url(#gradient-${color})`}
            fillOpacity={1}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default AreaChart;