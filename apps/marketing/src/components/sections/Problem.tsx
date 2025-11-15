import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';

type ChartData = {
  title: string;
  average: string;
  change: string;
  changeDirection: 'up' | 'down';
  maxValue: number;
  maxLabel: string;
  data: number[];
  categories?: { name: string; value: string; color: string }[];
  total?: string;
};

const chartConfigs: ChartData[] = [
  {
    title: 'Screen Time',
    average: '2h 39m',
    change: '29%',
    changeDirection: 'down',
    maxValue: 6,
    maxLabel: '6h',
    data: [2.1, 2.8, 1.9, 2.9, 5.7, 2.2, 2.6],
    categories: [
      { name: 'Social', value: '6h 9m', color: '#3b82f6' },
      { name: 'Information & Reading', value: '1h 38m', color: '#10b981' },
      { name: 'Other', value: '55m', color: '#f97316' },
    ],
    total: '18h 34m',
  },
  {
    title: 'Pickups',
    average: '66',
    change: '22%',
    changeDirection: 'down',
    maxValue: 100,
    maxLabel: '100',
    data: [58, 72, 61, 92, 45, 68, 65],
    total: '461',
  },
  {
    title: 'Notifications',
    average: '176',
    change: '15%',
    changeDirection: 'up',
    maxValue: 520,
    maxLabel: '520',
    data: [142, 158, 165, 198, 245, 152, 148],
    total: '1208',
  },
];

function ScreenTimeScreenshot({ delay = 0, chartIndex = 0 }: { delay?: number; chartIndex?: number }) {
  const { ref, isVisible } = useScrollFadeIn({ threshold: 0.2 });
  const chart = chartConfigs[chartIndex];

  const maxBarHeight = 120;
  const averageValue = chart.data.reduce((a, b) => a + b, 0) / chart.data.length;
  const averageHeight = (averageValue / chart.maxValue) * maxBarHeight;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Calculate and format average from data (using all y-axis values)
  const calculatedAverage = chartIndex === 0 
    ? (() => {
        const hours = Math.floor(averageValue);
        const minutes = Math.round((averageValue - hours) * 60);
        return `${hours}h ${minutes}m`;
      })()
    : Math.round(averageValue).toString();
  
  // Get current time
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-1000 ease-out h-full ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="relative mx-auto max-w-[280px] h-full rounded-[2.5rem] bg-black p-2 shadow-2xl flex flex-col">
        {/* iPhone notch */}
        <div className="absolute left-1/2 top-0 h-6 w-32 -translate-x-1/2 rounded-b-3xl bg-black" />
        
        {/* Screen content */}
        <div className="relative overflow-hidden rounded-[2rem] bg-white flex-1 flex flex-col">
          {/* Status bar */}
          <div className="flex items-center justify-between bg-white px-6 pt-3 pb-2 text-xs font-semibold">
            <span>{currentTime}</span>
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-black" />
              <div className="h-1 w-1 rounded-full bg-black" />
              <div className="h-1 w-1 rounded-full bg-black" />
            </div>
          </div>

          {/* Chart content */}
          <div className="bg-gray-50 px-4 py-6 flex-1 flex flex-col">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-700">{chart.title}</h3>
            </div>

            {/* Average section */}
            <div className="mb-4 rounded-lg bg-white px-4 py-3">
              <div className="mb-2 text-xs text-gray-500">This Week's Average</div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-2xl font-bold text-gray-900 whitespace-nowrap">{calculatedAverage}</div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                  <span className="text-green-500">↑</span>
                  <span>{chart.change} from last week</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="relative mb-2 rounded-lg bg-white px-3 py-4">
              {/* Chart area */}
              <div className="relative" style={{ height: `${maxBarHeight + 40}px` }}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-t border-dashed border-gray-200" />
                  ))}
                </div>

                {/* Average line */}
                <div
                  className="absolute left-0 right-0 z-10 border-t-2 border-dashed border-green-500"
                  style={{ top: `${maxBarHeight - averageHeight + 20}px` }}
                >
                  <span className="absolute right-0 top-[-8px] text-[10px] text-green-500 bg-white px-1">avg</span>
                </div>

                {/* Bars */}
                <div className="absolute bottom-0 left-0 right-0 z-0 flex items-end justify-between gap-1" style={{ height: `${maxBarHeight}px` }}>
                  {chart.data.map((value, i) => {
                    const height = (value / chart.maxValue) * maxBarHeight;
                    const isStacked = chartIndex === 0;
                    
                    if (isStacked) {
                      // Stacked bars for Screen Time
                      const socialHeight = (value * 0.6 / chart.maxValue) * maxBarHeight;
                      const infoHeight = (value * 0.2 / chart.maxValue) * maxBarHeight;
                      const otherHeight = (value * 0.15 / chart.maxValue) * maxBarHeight;
                      const grayHeight = height - socialHeight - infoHeight - otherHeight;
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: `${maxBarHeight}px` }}>
                          <div className="w-full" style={{ height: `${socialHeight}px`, backgroundColor: '#3b82f6' }} />
                          {infoHeight > 0 && (
                            <div className="w-full" style={{ height: `${infoHeight}px`, backgroundColor: '#10b981' }} />
                          )}
                          {otherHeight > 0 && (
                            <div className="w-full" style={{ height: `${otherHeight}px`, backgroundColor: '#f97316' }} />
                          )}
                          {grayHeight > 0 && (
                            <div className="w-full" style={{ height: `${grayHeight}px`, backgroundColor: '#e5e7eb' }} />
                          )}
                        </div>
                      );
                    } else {
                      // Simple bars for Pickups/Notifications
                      const barColor = chartIndex === 1 ? '#14b8a6' : '#ef4444';
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${height}px`,
                            backgroundColor: barColor,
                            minHeight: height > 0 ? '4px' : '0',
                          }}
                        />
                      );
                    }
                  })}
                </div>

                {/* Day labels */}
                <div className="absolute -bottom-5 left-0 right-0 flex justify-between gap-1">
                  {days.map((day, i) => (
                    <div key={i} className="flex-1 text-center text-[10px] text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center bg-white pb-2">
            <div className="h-1 w-32 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Problem() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            You're not checking your phone for entertainment.<br />
            You're checking for progress.
          </h2>

          <div className="text-lg text-muted-foreground space-y-4 max-w-3xl mx-auto">
            <p>
              Every unlock pulls you out of flow. You just wanted to see if you hit your step goal,
              check your daily word count, or confirm that Slack message got sent. But by the time
              you've unlocked your phone, dismissed three notifications, and opened the app, you've
              lost 20 minutes and your train of thought.
            </p>

            <p>
              If you're checking 60+ times a day, that's{' '}
              <span className="font-semibold text-foreground">3+ hours of interrupted focus</span>.
              Not because you lack discipline—because your information is hidden behind a lock screen.
            </p>
          </div>

          <div className="pt-8 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
            <div className="space-y-2">
              <div className="text-4xl font-bold">96</div>
              <div className="text-sm text-muted-foreground">
                Average phone unlocks per day for knowledge workers
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">20 min</div>
              <div className="text-sm text-muted-foreground">
                Cognitive recovery time per interruption
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">3+ hrs</div>
              <div className="text-sm text-muted-foreground">
                Lost focus time every single day
              </div>
            </div>
          </div>

          {/* iOS Screen Time Screenshots */}
          <div className="pt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto items-stretch">
            <ScreenTimeScreenshot delay={0} chartIndex={0} />
            <ScreenTimeScreenshot delay={150} chartIndex={1} />
            <ScreenTimeScreenshot delay={300} chartIndex={2} />
          </div>
        </div>
      </div>
    </section>
  );
}
