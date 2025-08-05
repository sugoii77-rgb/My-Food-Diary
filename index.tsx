import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

const translations = {
  en: {
    title: "My Food Diary",
    dailyLog: "Daily Log",
    weeklyPlan: "Weekly Plan",
    analysis: "Analysis",
    calendar: "Calendar",
    reset: "Reset Data",
    langToggle: "한글",
    date: "Date",
    breakfast: "Breakfast",
    lunch: "Lunch",
    snack: "Snack",
    dinner: "Dinner",
    mealTime: "Time",
    foodDesc: "What did you eat?",
    tasteRating: "Taste Rating",
    notes: "Notes",
    waterIntake: "Water Intake (500ml per cup)",
    weight: "Weight (kg)",
    sleep: "Sleep (hours)",
    energyLevel: "Energy Level",
    exercise: "Today's Exercise",
    weeklyNotes: "Weekly Notes",
    confirmReset: "Are you sure you want to reset the data for this view? This cannot be undone.",
    dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    energyLevels: ["Very Low", "Low", "Good", "High", "Very High"],
    today: "Today",
    prevDay: "Prev Day",
    nextDay: "Next Day",
    weightTrend: "30-Day Weight Trend",
    notEnoughData: "Not enough data to display the chart. Please enter weight data for at least two different days in the last month.",
    weightAxisLabel: "Weight (kg)",
  },
  ko: {
    title: "나의 식단 일기",
    dailyLog: "오늘의 기록",
    weeklyPlan: "주간 계획",
    analysis: "체중 분석",
    calendar: "캘린더",
    reset: "데이터 초기화",
    langToggle: "EN",
    date: "날짜",
    breakfast: "아침",
    lunch: "점심",
    snack: "간식",
    dinner: "저녁",
    mealTime: "시간",
    foodDesc: "무엇을 드셨나요?",
    tasteRating: "맛 평가",
    notes: "느낀 점",
    waterIntake: "물 섭취량 (컵당 500ml)",
    weight: "체중 (kg)",
    sleep: "수면 (시간)",
    energyLevel: "에너지 레벨",
    exercise: "오늘의 운동",
    weeklyNotes: "주간 메모",
    confirmReset: "이 화면의 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    dayNames: ["일", "월", "화", "수", "목", "금", "토"],
    energyLevels: ["매우 낮음", "낮음", "좋음", "높음", "매우 높음"],
    today: "오늘",
    prevDay: "이전 날",
    nextDay: "다음 날",
    weightTrend: "최근 30일 체중 변화",
    notEnoughData: "차트를 표시할 데이터가 부족합니다. 최근 30일 동안 최소 2일 이상의 체중을 입력해주세요.",
    weightAxisLabel: "체중 (kg)",
  },
};

type Language = keyof typeof translations;
type View = 'daily' | 'weekly' | 'analysis' | 'calendar';
type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

interface MealData {
  time: string;
  menu: string;
  rating: number | null;
  notes: string;
}

interface DailyLogData {
  meals: Record<MealType, MealData>;
  water: number;
  weight: string;
  sleep: number;
  energy: number;
  exercise: string;
  notes: string;
}

interface WeeklyPlanData {
  days: Record<string, Partial<Record<MealType, string>>>;
  notes: string;
}

interface AppData {
  daily: Record<string, DailyLogData>;
  weekly: Record<string, WeeklyPlanData>;
}

const useLocalStorage = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
};

const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

const MealCard: React.FC<{
  mealType: MealType;
  data: MealData;
  onChange: (field: keyof MealData, value: any) => void;
  t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ mealType, data, onChange, t }) => {
  const RATING_EMOJIS = ['😣', '😐', '🙂', '😋'];

  return (
    <div className="card meal-card">
        <h3 className="card-title">{t(mealType)}</h3>
        <div className="form-group">
            <label>{t('mealTime')}</label>
            <input
              type="time"
              className="form-input meal-time-input"
              value={data.time}
              onChange={(e) => onChange('time', e.target.value)}
            />
        </div>
        <div className="form-group">
            <label>{t('foodDesc')}</label>
            <textarea
                className="form-textarea"
                value={data.menu}
                onChange={(e) => onChange('menu', e.target.value)}
                rows={2}
            />
        </div>
        <div className="form-group">
            <label>{t('tasteRating')}</label>
            <div className="rating-group">
                {RATING_EMOJIS.map((emoji, i) => (
                    <button
                        key={i}
                        className={`emoji-button ${data.rating === i + 1 ? 'selected' : ''}`}
                        onClick={() => onChange('rating', data.rating === i + 1 ? null : i + 1)}
                        aria-label={`Rating ${i+1}`}
                        aria-pressed={data.rating === i + 1}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
        <div className="form-group">
            <label>{t('notes')}</label>
            <textarea
                className="form-textarea"
                value={data.notes}
                onChange={(e) => onChange('notes', e.target.value)}
            />
        </div>
    </div>
  );
};

const WaterTracker: React.FC<{
    count: number,
    setCount: (count: number) => void,
    t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ count, setCount, t }) => {
  const cups = Array.from({ length: 8 }, (_, i) => i < count);

  return (
    <div className="card">
      <h3 className="card-title">{t('waterIntake')}</h3>
      <div className="water-tracker">
        {cups.map((filled, i) => (
            <svg key={i} onClick={() => setCount(i + 1)} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={`Water cup ${i+1}, ${filled ? 'filled' : 'empty'}`}>
                <path d="M5 3L19 3L17 21H7L5 3Z" stroke={filled ? 'var(--water-filled)' : 'var(--water-empty)'} strokeWidth="2" strokeLinejoin="round"/>
                {filled && <path d="M7 12H17" stroke="var(--water-filled)" strokeWidth="2" />}
            </svg>
        ))}
      </div>
    </div>
  );
};

const DailyLog: React.FC<{
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  data: AppData;
  setData: (value: AppData | ((val: AppData) => AppData)) => void;
  t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ selectedDate, setSelectedDate, data, setData, t }) => {
    
  const initialDailyData = useMemo(() => ({
    meals: {
      breakfast: { time: '08:00', menu: '', rating: null, notes: '' },
      lunch: { time: '12:30', menu: '', rating: null, notes: '' },
      snack: { time: '16:00', menu: '', rating: null, notes: '' },
      dinner: { time: '19:00', menu: '', rating: null, notes: '' },
    },
    water: 0, weight: '', sleep: 8, energy: 3, exercise: '', notes: ''
  }), []);
    
  const dailyData = data.daily[selectedDate] || initialDailyData;

  const updateDailyData = (field: keyof DailyLogData, value: any) => {
    setData(prev => ({
      ...prev,
      daily: {
        ...prev.daily,
        [selectedDate]: { ...(prev.daily[selectedDate] || initialDailyData), [field]: value },
      },
    }));
  };
  
  const handleMealChange = (mealType: MealType, field: keyof MealData, value: any) => {
      const newMeals = {
          ...dailyData.meals,
          [mealType]: {
              ...dailyData.meals[mealType],
              [field]: value
          }
      };
      updateDailyData('meals', newMeals);
  };
  
  const navigateDay = (offset: number) => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    currentDate.setDate(currentDate.getDate() + offset);
    setSelectedDate(currentDate.toISOString().split('T')[0]);
  };
  
  const isToday = selectedDate === getTodayDateString();

  return (
    <div className="main-content">
        <div className="card date-navigator">
            <button className="date-navigator-btn" onClick={() => navigateDay(-1)}>&lt; {t('prevDay')}</button>
            <div className="date-picker-container">
                <input 
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    max={getTodayDateString()}
                    aria-label={t('date') as string}
                />
                {!isToday && <button className="today-btn" onClick={() => setSelectedDate(getTodayDateString())}>{t('today')}</button>}
            </div>
            <button className="date-navigator-btn" onClick={() => navigateDay(1)} disabled={isToday}>{t('nextDay')} &gt;</button>
        </div>
        <div className="daily-log-grid">
            <div className="card">
                <h3 className="card-title">{t('weight')}</h3>
                <input type="number" className="form-input" value={dailyData.weight} onChange={(e) => updateDailyData('weight', e.target.value)} placeholder="e.g., 65.5" />
            </div>
            <div className="card">
                <h3 className="card-title">{t('sleep')}</h3>
                 <div className="slider-group">
                    <input type="range" min="0" max="16" step="0.5" value={dailyData.sleep} onChange={(e) => updateDailyData('sleep', parseFloat(e.target.value))} />
                    <span>{dailyData.sleep} hrs</span>
                </div>
            </div>
            <div className="card">
                <h3 className="card-title">{t('energyLevel')}</h3>
                 <div className="slider-group">
                    <input type="range" min="1" max="5" value={dailyData.energy} onChange={(e) => updateDailyData('energy', parseInt(e.target.value))} />
                    <span>{(t('energyLevels') as string[])[dailyData.energy - 1]}</span>
                </div>
            </div>
             <WaterTracker count={dailyData.water} setCount={(c) => updateDailyData('water', c)} t={t} />
             <div className="card">
                <h3 className="card-title">{t('exercise')}</h3>
                <textarea className="form-textarea" value={dailyData.exercise} onChange={(e) => updateDailyData('exercise', e.target.value)} />
            </div>
            <div className="card">
                <h3 className="card-title">{t('notes')}</h3>
                <textarea className="form-textarea" value={dailyData.notes} onChange={(e) => updateDailyData('notes', e.target.value)} />
            </div>
        </div>

        <div className="meal-card-container">
            {(Object.keys(dailyData.meals) as MealType[]).map(mealType => (
                <MealCard
                    key={mealType}
                    mealType={mealType}
                    data={dailyData.meals[mealType]}
                    onChange={(field, value) => handleMealChange(mealType, field, value)}
                    t={t}
                />
            ))}
        </div>
    </div>
  );
};

const WeeklyPlanner: React.FC<{
  data: AppData;
  setData: (value: AppData | ((val: AppData) => AppData)) => void;
  t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ data, setData, t }) => {
    const today = new Date();
    const weekStart = getWeekStartDate(today);
    
    const weekData = data.weekly[weekStart] || { days: {}, notes: '' };

    const handlePlanChange = (date: string, meal: MealType, value: string) => {
        setData(prev => {
            const newWeekData = {...(prev.weekly[weekStart] || { days: {}, notes: '' })};
            if(!newWeekData.days[date]) newWeekData.days[date] = {};
            newWeekData.days[date][meal] = value;
            return {
                ...prev,
                weekly: { ...prev.weekly, [weekStart]: newWeekData }
            };
        });
    };

    const handleNotesChange = (value: string) => {
        setData(prev => {
            const newWeekData = {...(prev.weekly[weekStart] || { days: {}, notes: '' })};
            newWeekData.notes = value;
            return {
                ...prev,
                weekly: { ...prev.weekly, [weekStart]: newWeekData }
            };
        });
    }

    const weekDates = useMemo(() => {
        const dates = [];
        const start = new Date(weekStart);
        for(let i=0; i<7; i++){
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, [weekStart]);

    const mealTypes: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

    return (
        <div className="weekly-planner-container">
            <div className="card">
                <table className="planner-table">
                    <thead>
                        <tr>
                            <th>{t('date')}</th>
                            {mealTypes.map(meal => <th key={meal}>{t(meal)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {weekDates.map(date => {
                            const dateString = date.toISOString().split('T')[0];
                            const dayPlan = weekData.days[dateString] || {};
                            return (
                                <tr key={dateString}>
                                    <td className="date-cell">
                                        {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                        <br/>
                                        {(t('dayNames') as string[])[date.getDay()]}
                                    </td>
                                    {mealTypes.map(meal => (
                                        <td key={meal}>
                                            <textarea
                                                value={dayPlan[meal] || ''}
                                                onChange={(e) => handlePlanChange(dateString, meal, e.target.value)}
                                                rows={4}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="card" style={{marginTop: '1.5rem'}}>
                <h3 className="card-title">{t('weeklyNotes')}</h3>
                <textarea className="form-textarea" value={weekData.notes} onChange={(e) => handleNotesChange(e.target.value)} />
            </div>
        </div>
    );
}

const WeightChart: React.FC<{
  chartData: { date: string, weight: number }[];
  t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ chartData, t }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; weight: number; } | null>(null);

  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 400;
  const PADDING = { top: 20, right: 30, bottom: 60, left: 50 };

  const weightValues = chartData.map(d => d.weight);
  const minWeight = Math.min(...weightValues);
  const maxWeight = Math.max(...weightValues);
  
  const dateValues = chartData.map(d => new Date(d.date).getTime());
  const minDate = Math.min(...dateValues);
  const maxDate = Math.max(...dateValues);

  const yTicks = useMemo(() => {
    const domain = maxWeight - minWeight;
    if (domain === 0) return [minWeight];
    const tickCount = 5;
    const step = (maxWeight - minWeight) / (tickCount - 1);
    return Array.from({length: tickCount}, (_, i) => parseFloat((minWeight + (i * step)).toFixed(1)));
  }, [minWeight, maxWeight]);
  
  const xTicks = useMemo(() => {
    const domain = maxDate - minDate;
    if (domain === 0) return [new Date(minDate)];
    const tickCount = Math.min(7, chartData.length);
    const step = domain / (tickCount -1);
    return Array.from({length: tickCount}, (_, i) => new Date(minDate + (i * step)));
  }, [minDate, maxDate, chartData.length]);

  const getCoords = (dateStr: string, weight: number) => {
    const date = new Date(dateStr).getTime();
    const x = PADDING.left + ((date - minDate) / (maxDate - minDate)) * (SVG_WIDTH - PADDING.left - PADDING.right);
    const y = PADDING.top + ((maxWeight - weight) / (maxWeight - minWeight)) * (SVG_HEIGHT - PADDING.top - PADDING.bottom);
    return { x, y };
  };

  const linePath = chartData.map(d => {
    const { x, y } = getCoords(d.date, d.weight);
    return `${x},${y}`;
  }).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;
    
    const inverted = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    
    let closestPoint = null;
    let minDistance = Infinity;

    chartData.forEach(d => {
        const {x, y} = getCoords(d.date, d.weight);
        const distance = Math.sqrt(Math.pow(inverted.x - x, 2) + Math.pow(inverted.y - y, 2));
        if (distance < minDistance) {
            minDistance = distance;
            closestPoint = {x, y, date: d.date, weight: d.weight};
        }
    });

    if (closestPoint && minDistance < 30) {
        setTooltip(closestPoint);
    } else {
        setTooltip(null);
    }
  };

  return (
    <div className="weight-chart-container">
        <h4>{t('weightTrend')}</h4>
        <div className="chart-wrapper">
             <svg ref={svgRef} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
                {/* Axes and Grid lines */}
                <g className="chart-grid">
                    {yTicks.map(tick => {
                        const { y } = getCoords(chartData[0].date, tick);
                        return <line key={tick} className="chart-grid-line" x1={PADDING.left} x2={SVG_WIDTH - PADDING.right} y1={y} y2={y} />;
                    })}
                </g>
                <g className="chart-axes">
                    <line className="chart-axis-line" x1={PADDING.left} y1={SVG_HEIGHT - PADDING.bottom} x2={SVG_WIDTH - PADDING.right} y2={SVG_HEIGHT - PADDING.bottom} />
                    <line className="chart-axis-line" x1={PADDING.left} y1={PADDING.top} x2={PADDING.left} y2={SVG_HEIGHT - PADDING.bottom} />
                    
                    {yTicks.map(tick => (
                        <text key={`ytick-${tick}`} className="chart-axis-text" x={PADDING.left - 8} y={getCoords(chartData[0].date, tick).y + 3} textAnchor="end">{tick}</text>
                    ))}
                     <text className="chart-axis-label" transform={`translate(${PADDING.left/3}, ${SVG_HEIGHT/2}) rotate(-90)`}>{t('weightAxisLabel')}</text>
                    
                    {xTicks.map((tick, i) => (
                         <text key={`xtick-${i}`} className="chart-axis-text" x={getCoords(tick.toISOString(), minWeight).x} y={SVG_HEIGHT - PADDING.bottom + 20} textAnchor="middle">
                            {tick.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                         </text>
                    ))}
                    <text className="chart-axis-label" x={SVG_WIDTH/2} y={SVG_HEIGHT - PADDING.bottom + 45}>{t('date')}</text>
                </g>

                {/* Data line */}
                <polyline className="chart-line" points={linePath} />

                {/* Data points */}
                <g className="chart-points">
                    {chartData.map(d => {
                        const { x, y } = getCoords(d.date, d.weight);
                        const isTooltipActive = tooltip?.date === d.date;
                        return (
                          <circle
                            key={d.date}
                            className="chart-point"
                            cx={x}
                            cy={y}
                            r={isTooltipActive ? 7 : 4}
                          />
                        );
                    })}
                </g>
                
                {/* Tooltip */}
                {tooltip && (
                    <g transform={`translate(${tooltip.x}, ${tooltip.y})`}>
                        <foreignObject x={-60} y={-65} width="120" height="50">
                             <div className="chart-tooltip">
                                <div className="tooltip-date">{new Date(tooltip.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</div>
                                <div className="tooltip-weight">{tooltip.weight} kg</div>
                            </div>
                        </foreignObject>
                    </g>
                )}
            </svg>
        </div>
    </div>
  );
};

const AnalysisView: React.FC<{
  data: AppData;
  t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ data, t }) => {
    const chartData = useMemo(() => {
        const dataPoints: { date: string; weight: number }[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateString = d.toISOString().split('T')[0];
            const dailyEntry = data.daily[dateString];
            if (dailyEntry && dailyEntry.weight && !isNaN(parseFloat(dailyEntry.weight))) {
                dataPoints.push({
                    date: dateString,
                    weight: parseFloat(dailyEntry.weight),
                });
            }
        }
        return dataPoints;
    }, [data]);

    if (chartData.length < 2) {
        return (
            <div className="card analysis-view">
                <p>{t('notEnoughData')}</p>
            </div>
        );
    }

    return (
        <div className="analysis-view">
            <WeightChart chartData={chartData} t={t} />
        </div>
    );
};

const CalendarView: React.FC<{
  dailyData: Record<string, DailyLogData>;
  onDateSelect: (date: string) => void;
  t: (key: keyof (typeof translations)['en']) => string | string[];
}> = ({ dailyData, onDateSelect, t }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const weeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun
    const calendarStartDate = new Date(firstDayOfMonth);
    calendarStartDate.setDate(calendarStartDate.getDate() - firstDayOfWeek);

    const generatedWeeks: Date[][] = [];
    for (let i = 0; i < 6; i++) {
      const week: Date[] = [];
      for (let j = 0; j < 7; j++) {
        const day = new Date(calendarStartDate);
        week.push(day);
        calendarStartDate.setDate(calendarStartDate.getDate() + 1);
      }
      generatedWeeks.push(week);
    }
    return generatedWeeks;
  }, [currentDate]);
  
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const lang = t('langToggle') === 'EN' ? 'ko-KR' : 'en-US';

  return (
    <div className="card calendar-view">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-btn" aria-label="Previous month">&lt;</button>
        <h3>{currentDate.toLocaleString(lang, { year: 'numeric', month: 'long' })}</h3>
        <button onClick={handleNextMonth} className="calendar-nav-btn" aria-label="Next month">&gt;</button>
      </div>
      <table className="calendar-grid">
        <thead>
          <tr>
            {(t('dayNames') as string[]).map(day => <th key={day}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, i) => (
            <tr key={i}>
              {week.map((day, j) => {
                const dateString = day.toISOString().split('T')[0];
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = dateString === todayString;
                const hasLog = !!dailyData[dateString];

                const cellClasses = [
                  'calendar-day-cell',
                  isCurrentMonth ? '' : 'other-month',
                  isToday ? 'is-today' : ''
                ].join(' ').trim();

                return (
                  <td key={j} className={cellClasses} onClick={() => onDateSelect(dateString)}>
                    <div className='calendar-day-content'>
                        <span className="day-number">{day.getDate()}</span>
                        {hasLog && <div className="log-indicator"></div>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const App = () => {
  const [lang, setLang] = useLocalStorage<Language>('foodDiary_lang', 'ko');
  const [view, setView] = useState<View>('daily');
  const [data, setData] = useLocalStorage<AppData>('foodDiary_data', { daily: {}, weekly: {} });
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());

  const t = useCallback((key: keyof (typeof translations)['en']) => {
    return translations[lang][key] || translations['en'][key];
  }, [lang]);
  
  useEffect(() => {
    document.body.style.fontFamily = lang === 'ko' ? "var(--font-ko), var(--font-en)" : "var(--font-en), var(--font-ko)";
  }, [lang]);

  const toggleLang = () => {
    setLang(lang === 'ko' ? 'en' : 'ko');
  };

  const handleReset = () => {
      if(window.confirm(t('confirmReset') as string)){
          if(view === 'daily'){
              setData(prev => {
                  const newDaily = {...prev.daily};
                  delete newDaily[selectedDate];
                  return {...prev, daily: newDaily};
              });
          } else if (view === 'weekly') {
              const weekStart = getWeekStartDate(new Date());
              setData(prev => {
                  const newWeekly = {...prev.weekly};
                  delete newWeekly[weekStart];
                  return {...prev, weekly: newWeekly};
              });
          }
      }
  };
  
  const handleDateSelectFromCalendar = (date: string) => {
    setSelectedDate(date);
    setView('daily');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{t('title')}</h1>
        <div className="nav-controls">
          <div className="nav-tabs">
            <button className={`nav-button ${view === 'daily' ? 'active' : ''}`} onClick={() => setView('daily')}>{t('dailyLog')}</button>
            <button className={`nav-button ${view === 'weekly' ? 'active' : ''}`} onClick={() => setView('weekly')}>{t('weeklyPlan')}</button>
            <button className={`nav-button ${view === 'analysis' ? 'active' : ''}`} onClick={() => setView('analysis')}>{t('analysis')}</button>
            <button className={`nav-button ${view === 'calendar' ? 'active' : ''}`} onClick={() => setView('calendar')}>{t('calendar')}</button>
          </div>
          <button className="control-button" onClick={handleReset} disabled={view === 'analysis' || view === 'calendar'}>{t('reset')}</button>
          <button className="control-button" onClick={toggleLang}>{t('langToggle')}</button>
        </div>
      </header>

      <main>
        {view === 'daily' && <DailyLog selectedDate={selectedDate} setSelectedDate={setSelectedDate} data={data} setData={setData} t={t} />}
        {view === 'weekly' && <WeeklyPlanner data={data} setData={setData} t={t} />}
        {view === 'analysis' && <AnalysisView data={data} t={t} />}
        {view === 'calendar' && <CalendarView dailyData={data.daily} onDateSelect={handleDateSelectFromCalendar} t={t} />}
      </main>

      <footer className="app-footer">
          <p>&copy; {new Date().getFullYear()} My Food Diary. Made with ♡.</p>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
