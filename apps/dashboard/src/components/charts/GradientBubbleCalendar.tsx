import { motion } from 'framer-motion';
import './Chart.css';

const DEFAULT_BLUE_COLORS = ['#5fa3ea', '#7fb6f1', '#a7ccf8', '#cadffd', '#d0e5ff'] as const;
const DEFAULT_GREEN_COLORS = ['#2eb28f', '#3fc49f', '#4fd5af', '#6fe5bf', '#7febcf'] as const;
const MAX_LAYERS = DEFAULT_BLUE_COLORS.length;
const MIN_LAYER_SIZE = 18;
const LAYER_STEP = 12;

interface GradientBubbleCalendarProps {
  data: {
    date: string;
    dayOfWeek: number;
    value: number;
  }[];
  animationKey?: string;
  colorScheme?: 'blue' | 'green' | string[];
  unit?: string;
}

const GradientBubbleCalendar = ({
  data,
  animationKey = 'default',
  colorScheme = 'blue',
  unit = '%',
}: GradientBubbleCalendarProps) => {
  const getColors = (): readonly string[] => {
    if (Array.isArray(colorScheme)) {
      return colorScheme;
    }
    if (colorScheme === 'green') {
      return DEFAULT_GREEN_COLORS;
    }
    return DEFAULT_BLUE_COLORS;
  };

  const layerColors = getColors();

  const getPopBackgroundColor = (): string => {
    if (colorScheme === 'green') {
      return 'rgba(15, 41, 35, 0.95)';
    } else if (Array.isArray(colorScheme)) {
      return 'rgba(20, 30, 45, 0.95)';
    }
    return 'rgba(20, 30, 45, 0.95)';
  };

  const getPopBoxShadowColor = (): string => {
    return 'rgba(0, 0, 0, 0.4)';
  };

  const popBackgroundColor = getPopBackgroundColor();
  const popBoxShadowColor = getPopBoxShadowColor();

  const getLayers = (value: number) => {
    if (value <= 20) return 1;
    if (value <= 40) return 2;
    if (value <= 60) return 3;
    if (value <= 80) return 4;
    return 5;
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  const weeks: typeof data[] = [];
  let currentWeek: typeof data = [];

  data.forEach((item, index) => {
    if (item.dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(item);
    if (index === data.length - 1) {
      weeks.push(currentWeek);
    }
  });

  return (
    <div className="gradient-bubble-calendar">
      <div className="calendar-header">
        {weekDays.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="calendar-week">
          {weekDays.map((_, dayIndex) => {
            const item = week.find((w) => w.dayOfWeek === dayIndex);
            if (!item) {
              return <div key={dayIndex} className="calendar-day empty" />;
            }
            const layers = getLayers(item.value);
            const dayKey = `${animationKey}-${item.date}-${dayIndex}`;

            return (
              <motion.div
                key={dayKey}
                className="calendar-day"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: dayIndex * 0.03 }}
                whileHover={{ scale: 1.08 }}
              >
                <div className="gradient-bubble-container">
                  {Array.from({ length: MAX_LAYERS }).map((_, orderIndex) => {
                    const depth = MAX_LAYERS - orderIndex - 1;
                    const size = MIN_LAYER_SIZE + depth * LAYER_STEP;
                    const depthRatio = depth / Math.max(MAX_LAYERS - 1, 1);
                    const color =
                      layerColors[Math.min(depth, layerColors.length - 1)];

                    return (
                      <motion.div
                        key={`${dayKey}-layer-${depth}`}
                        className="gradient-bubble-layer"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          backgroundColor: color,
                          opacity: depth < layers ? 0.7 - depthRatio * 0.2 : 0,
                          boxShadow: 'none',
                          pointerEvents: 'none',
                        }}
                        transition={{ duration: 0.35, delay: orderIndex * 0.03 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    );
                  })}
                  <div 
                    className="bubble-pop"
                    style={{
                      background: popBackgroundColor,
                      boxShadow: `0 8px 16px ${popBoxShadowColor}`,
                    }}
                  >
                    {item.value}{unit}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default GradientBubbleCalendar;