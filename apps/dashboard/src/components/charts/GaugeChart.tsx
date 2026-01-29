import { motion } from 'framer-motion';
import './Chart.css';

type GaugeColor = 'green' | 'yellow' | 'orange' | 'red';

interface HourlyGaugeValue {
  time: string;
  value: number;
  isCurrent?: boolean;
  isPlayed?: boolean;
}

interface GaugeChartProps {
  name: string;
  percentage: number;
  color?: GaugeColor;
  hourlyValues?: HourlyGaugeValue[];
}

const getColorForValue = (value: number): GaugeColor => {
  if (value < 50) return 'green';
  if (value < 75) return 'yellow';
  return 'red';
};

const getColorToken = (value: number) => {
  const color = getColorForValue(value);
  if (color === 'green') return '#22c55e';
  if (color === 'yellow') return '#fbbf24';
  return '#ef4444';
};

const GaugeChart = ({ name, percentage, hourlyValues = [] }: GaugeChartProps) => {
  const size = 140;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = radius; // 半円の下端のY座標（上向きの半円）
  
  // 半円の角度（Rechartsと同じ: startAngle=180, endAngle=0）
  // 上向きの半円: 左端（180度）から右端（0度）へ
  const startAngle = Math.PI; // 180度（左端）
  const endAngle = 0; // 0度（右端）
  
  // パスの計算（半円の弧）- 上向きの半円
  const getArcPath = (start: number, end: number) => {
    const angleDiff = Math.abs(start - end);
    const largeArcFlag = angleDiff > Math.PI ? 1 : 0;
    const x1 = centerX + radius * Math.cos(start);
    const x2 = centerX + radius * Math.cos(end);
    const y1Top = centerY - radius * Math.sin(start);
    const y2Top = centerY - radius * Math.sin(end);
    return `M ${x1} ${y1Top} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x2} ${y2Top}`;
  };

  const paddingTop = strokeWidth / 2 + 5; // 上部の余白（はみ出し防止）
  const gaugeSegments = hourlyValues.length
    ? hourlyValues
    : [{ time: '', value: percentage, isCurrent: true }];
  const segmentAngle = (startAngle - endAngle) / gaugeSegments.length;

  return (
    <motion.div
      className="-gauge-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="gauge-wrapper"
        style={{
          width: size,
          height: size / 2 + 30,
          position: 'relative',
        }}
      >
        <svg 
          width={size} 
          height={radius + paddingTop + 10} 
          viewBox={`0 ${-paddingTop} ${size} ${radius + paddingTop + 10}`}
          style={{ overflow: 'hidden' }}
        >
          {/* 時間帯ごとのセグメント */}
          {(() => {
            let currentStart = startAngle;
            return gaugeSegments.map((segment, idx) => {
              const nextAngle =
                idx === gaugeSegments.length - 1
                  ? endAngle
                  : currentStart - segmentAngle;
              const path = getArcPath(currentStart, nextAngle);
              const hasColor = segment.isCurrent || segment.isPlayed;
              const color = hasColor ? getColorToken(segment.value) : 'rgba(148, 163, 184, 0.35)';
              currentStart = nextAngle;
              return (
                <motion.path
                  key={`${name}-slot-${segment.time}-${idx}`}
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={segment.isCurrent ? strokeWidth + 2 : strokeWidth}
                  strokeLinecap="butt"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: hasColor ? 1 : 0.6 }}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.01 }}
                  opacity={segment.isCurrent ? 1 : hasColor ? 0.75 : 0.4}
                />
              );
            });
          })()}
        </svg>
        <div
          className="gauge-center"
          style={{
            top: '70%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="gauge-percentage">{percentage}%</div>
          <div className="gauge-label">{name}</div>
        </div>
        {hourlyValues.length > 0 && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              bottom: -4,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#94a3b8',
            }}
          >
            <span>0:00</span>
            <span>23:59</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GaugeChart;