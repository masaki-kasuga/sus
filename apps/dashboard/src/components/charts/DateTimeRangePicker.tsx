import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimeRangePickerProps {
  startDateTime: string;
  endDateTime: string;
  onApply: (startDateTime: string, endDateTime: string) => void;
  minDate?: string;
  maxDate?: string;
  buttonWidth?: number;
}

const MODAL_Z_INDEX_BASE = 20000;

interface CustomCalendarProps {
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  onClose: () => void;
}

const CustomCalendar = ({ value, onChange, minDate, maxDate, onClose }: CustomCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const selectedDate = value ? new Date(value) : null;
  const minDateObj = minDate ? (() => {
    const [y, m, d] = minDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  })() : null;
  const maxDateObj = maxDate ? (() => {
    const [y, m, d] = maxDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  })() : null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  const isDateDisabled = (day: number): boolean => {
    const date = new Date(year, month, day);
    // 時刻を0時に設定して日付のみを比較
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (minDateObj) {
      const minDateOnly = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate());
      if (dateOnly < minDateOnly) return true;
    }
    if (maxDateObj) {
      const maxDateOnly = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate());
      if (dateOnly > maxDateOnly) return true;
    }
    return false;
  };

  const isDateSelected = (day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const handleDateClick = (day: number) => {
    if (isDateDisabled(day)) return;
    const date = new Date(year, month, day);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    onClose();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const days = [];
  // 前月の日付（最初の週を埋める）
  const prevMonthDays = firstDayOfMonth;
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = prevMonthLastDay - prevMonthDays + 1; i <= prevMonthLastDay; i++) {
    days.push({ day: i, isCurrentMonth: false, isPrevMonth: true });
  }
  // 今月の日付
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true, isPrevMonth: false });
  }
  // 次月の日付（最後の週を埋める）
  const remainingDays = 42 - days.length; // 6週間分
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ day: i, isCurrentMonth: false, isPrevMonth: false });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -10 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute',
        top: 0,
        left: '100%',
        marginLeft: '12px',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '20px',
        minWidth: '320px',
        zIndex: MODAL_Z_INDEX_BASE + 20,
        border: '1px solid rgba(229, 231, 235, 0.8)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToPreviousMonth}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronLeft size={20} style={{ color: '#6366f1' }} />
        </motion.button>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>
          {year}年 {monthNames[month]}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={goToNextMonth}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <ChevronRight size={20} style={{ color: '#6366f1' }} />
        </motion.button>
      </div>

      {/* 曜日ヘッダー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {dayNames.map((day, index) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 600,
              color: index === 0 ? '#ef4444' : index === 6 ? '#3b82f6' : '#6b7280',
              padding: '8px 4px',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {days.map(({ day, isCurrentMonth }, index) => {
          const isDisabled = isCurrentMonth && isDateDisabled(day);
          const isSelected = isCurrentMonth && isDateSelected(day);
          const isToday = isCurrentMonth && (() => {
            const today = new Date();
            return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          })();

          return (
            <motion.button
              key={index}
              whileHover={!isDisabled && !isSelected ? { scale: 1.1 } : {}}
              whileTap={!isDisabled ? { scale: 0.9 } : {}}
              onClick={() => isCurrentMonth && handleDateClick(day)}
              disabled={isDisabled}
              style={{
                aspectRatio: '1',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isSelected ? 600 : 500,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                background: isSelected
                  ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                  : isToday
                  ? 'rgba(99, 102, 241, 0.1)'
                  : 'transparent',
                color: isSelected
                  ? 'white'
                  : !isCurrentMonth
                  ? '#d1d5db'
                  : isDisabled
                  ? '#d1d5db'
                  : isToday
                  ? '#6366f1'
                  : '#374151',
                transition: 'all 0.2s',
                position: 'relative',
                boxShadow: isSelected ? '0 4px 6px -1px rgba(99, 102, 241, 0.3)' : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected && isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = isToday ? 'rgba(99, 102, 241, 0.1)' : 'transparent';
                }
              }}
            >
              {day}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

const DateTimeRangePicker = ({
  startDateTime: initialStartDateTime,
  endDateTime: initialEndDateTime,
  onApply,
  minDate,
  maxDate,
  buttonWidth = 460,
}: DateTimeRangePickerProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDateTime, setStartDateTime] = useState(initialStartDateTime);
  const [endDateTime, setEndDateTime] = useState(initialEndDateTime);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const startCalendarRef = useRef<HTMLDivElement>(null);
  const endCalendarRef = useRef<HTMLDivElement>(null);
  const startCalendarButtonRef = useRef<HTMLButtonElement>(null);
  const endCalendarButtonRef = useRef<HTMLButtonElement>(null);
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  // 初期値が変更されたら内部状態を更新
  useEffect(() => {
    setStartDateTime(initialStartDateTime);
    setEndDateTime(initialEndDateTime);
  }, [initialStartDateTime, initialEndDateTime]);

  // 日時文字列から日付と時刻を分離
  const parseDateTime = (dateTimeStr: string): { date: string; time: string } => {
    const [date, time] = dateTimeStr.split(' ');
    return { date: date || '', time: time || '00:00:00' };
  };

  // 日付と時刻を結合
  const combineDateTime = (date: string, time: string): string => {
    return `${date} ${time}`;
  };

  // 期間表示用のフォーマット
  const formatDateRange = (): string => {
    const start = parseDateTime(startDateTime);
    const end = parseDateTime(endDateTime);
    return `${start.date} ${start.time} 〜 ${end.date} ${end.time}`;
  };

  // Apply time rangeボタンのハンドラ
  const handleApplyTimeRange = () => {
    onApply(startDateTime, endDateTime);
    setShowDatePicker(false);
  };

  // モダル外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // カレンダーモーダルが表示されている場合
      if (showStartCalendar || showEndCalendar) {
        const isClickInsideCalendar = 
          (startCalendarRef.current && startCalendarRef.current.contains(target)) ||
          (endCalendarRef.current && endCalendarRef.current.contains(target));
        
        const isClickOnCalendarButton =
          (startCalendarButtonRef.current && startCalendarButtonRef.current.contains(target)) ||
          (endCalendarButtonRef.current && endCalendarButtonRef.current.contains(target));
        
        // カレンダーモーダルやカレンダーボタン以外をクリックした場合、カレンダーモーダルだけを閉じる
        if (!isClickInsideCalendar && !isClickOnCalendarButton) {
          setShowStartCalendar(false);
          setShowEndCalendar(false);
        }
      }
      
      // メインモーダルが表示されている場合
      if (showDatePicker) {
        const isClickInsideModal = 
          (modalRef.current && modalRef.current.contains(target)) ||
          (buttonRef.current && buttonRef.current.contains(target));
        
        // メインモーダル以外をクリックした場合、メインモーダルを閉じる
        if (!isClickInsideModal) {
          setShowDatePicker(false);
          // メインモーダルが閉じられる時は、カレンダーモーダルも閉じる
          setShowStartCalendar(false);
          setShowEndCalendar(false);
        }
      }
    };

    if (showDatePicker || showStartCalendar || showEndCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker, showStartCalendar, showEndCalendar]);

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="date-picker-toggle"
        style={{
          minWidth: `${buttonWidth}px`,
          width: `${buttonWidth}px`,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        <Calendar size={18} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDateRange()}</span>
      </motion.button>
      <AnimatePresence>
        {showDatePicker && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: MODAL_Z_INDEX_BASE,
                pointerEvents: 'auto',
                background: 'transparent',
              }}
              onClick={() => setShowDatePicker(false)}
            />
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                zIndex: MODAL_Z_INDEX_BASE + 10,
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '24px',
                minWidth: '340px',
                maxHeight: '90vh',
                overflow: 'visible',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* From */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CalendarClock size={18} style={{ color: '#6366f1' }} />
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>From</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      placeholder="2025-12-01 00:00:00"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        fontFamily: '"SFMono-Regular", "JetBrains Mono", "Fira Code", "Roboto Mono", monospace',
                        letterSpacing: '0.02em',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      ref={startCalendarButtonRef}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showStartCalendar) {
                          setShowStartCalendar(false);
                        } else {
                          setShowStartCalendar(true);
                          setShowEndCalendar(false);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                      }}
                    >
                      <Calendar size={18} style={{ color: '#6366f1', display: 'block' }} />
                    </button>
                  </div>
                </div>

                {/* To */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <CalendarClock size={18} style={{ color: '#6366f1' }} />
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>To</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      placeholder="2025-12-31 23:59:59"
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        fontSize: '13px',
                        outline: 'none',
                        transition: 'all 0.2s',
                        fontFamily: '"SFMono-Regular", "JetBrains Mono", "Fira Code", "Roboto Mono", monospace',
                        letterSpacing: '0.02em',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      ref={endCalendarButtonRef}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (showEndCalendar) {
                          setShowEndCalendar(false);
                        } else {
                          setShowEndCalendar(true);
                          setShowStartCalendar(false);
                        }
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                      }}
                    >
                      <Calendar size={18} style={{ color: '#6366f1', display: 'block' }} />
                    </button>
                  </div>
                </div>

                {/* Apply time range button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApplyTimeRange}
                  style={{
                    width: '100%',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3), 0 2px 4px -1px rgba(99, 102, 241, 0.2)',
                    transition: 'all 0.2s',
                  }}
                >
                  Apply time range
                </motion.button>
              </div>
              <AnimatePresence>
                {showStartCalendar && (
                  <div ref={startCalendarRef}>
                    <CustomCalendar
                      value={parseDateTime(startDateTime).date}
                      onChange={(date) => {
                        const { time } = parseDateTime(startDateTime);
                        setStartDateTime(combineDateTime(date, time));
                      }}
                      minDate={minDate}
                      maxDate={parseDateTime(endDateTime).date}
                      onClose={() => setShowStartCalendar(false)}
                    />
                  </div>
                )}
                {showEndCalendar && (
                  <div ref={endCalendarRef}>
                    <CustomCalendar
                      value={parseDateTime(endDateTime).date}
                      onChange={(date) => {
                        const { time } = parseDateTime(endDateTime);
                        setEndDateTime(combineDateTime(date, time));
                      }}
                      minDate={parseDateTime(startDateTime).date}
                      maxDate={maxDate}
                      onClose={() => setShowEndCalendar(false)}
                    />
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateTimeRangePicker;