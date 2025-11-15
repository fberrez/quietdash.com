type DashboardType = 'productivity' | 'health' | 'github' | 'portfolio' | 'morning';

interface DashboardMockupProps {
  type: DashboardType;
  className?: string;
}

// Helper functions for date/time formatting
function getCurrentDate(): string {
  const now = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getCurrentDateLong(): string {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

export function DashboardMockup({ type, className = '' }: DashboardMockupProps) {
  return (
    <div className={`bg-white border-2 border-black rounded-lg overflow-hidden shadow-inner ${className}`} style={{ aspectRatio: '800/480' }}>
      <div className="h-full w-full scale-90 origin-center">
        {type === 'productivity' && <ProductivityDashboard />}
        {type === 'health' && <HealthDashboard />}
        {type === 'github' && <GitHubDashboard />}
        {type === 'portfolio' && <PortfolioDashboard />}
        {type === 'morning' && <MorningDashboard />}
      </div>
    </div>
  );
}

function ProductivityDashboard() {
  return (
    <div className="p-4 space-y-3 bg-white text-black" style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="text-sm font-bold">PRODUCTIVITY</div>
        <div className="text-sm">{getCurrentDate()}</div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-2 gap-2">
        {/* Pomodoro */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">POMODORO</div>
          <div className="text-xl font-bold">15m</div>
          <div className="text-[10px] mt-1">WORK</div>
          <div className="text-[10px] mt-1">Sessions: 4</div>
        </div>

        {/* Goals */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">DAILY GOALS</div>
          <div className="text-xl font-bold">5/8</div>
          <div className="mt-1 h-1.5 border border-black">
            <div className="h-full bg-black" style={{ width: '62%' }} />
          </div>
          <div className="text-[10px] mt-1">Progress: 62%</div>
        </div>

        {/* Messages */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">UNREAD</div>
          <div className="text-xl font-bold">28</div>
          <div className="text-[10px] mt-1">Email: 18</div>
          <div className="text-[10px]">Slack: 10</div>
        </div>

        {/* Deep Work */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">DEEP WORK</div>
          <div className="text-xl font-bold">12.5h</div>
          <div className="text-[10px] mt-1">This week</div>
          <div className="text-[10px]">Streak: 5 days</div>
        </div>
      </div>

      {/* Todos */}
      <div className="border-2 border-black p-2">
        <div className="text-[10px] mb-2 font-bold">PRIORITY TODO</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 border border-black" />
            <span>Review API</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 border-2 border-black bg-black" />
            <span>Prepare presentation</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="w-3 h-3 border border-black" />
            <span>Fix authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthDashboard() {
  return (
    <div className="p-4 space-y-3 bg-white text-black" style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="text-sm font-bold">HEALTH</div>
        <div className="text-sm">{getCurrentDate()}</div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-3 gap-2">
        {/* Steps */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">STEPS</div>
          <div className="text-base font-bold">8,234</div>
          <div className="mt-1 h-1 border border-black">
            <div className="h-full bg-black" style={{ width: '82%' }} />
          </div>
          <div className="text-[10px] mt-1">Goal: 10,000</div>
        </div>

        {/* Water */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">WATER</div>
          <div className="text-base font-bold">6/8</div>
          <div className="text-[10px] mt-1">1.5L today</div>
        </div>

        {/* Sleep */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">SLEEP</div>
          <div className="text-base font-bold">7.2h</div>
          <div className="text-[10px] mt-1">Score: 85</div>
        </div>

        {/* Workout */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">WORKOUT</div>
          <div className="text-base font-bold">7 days</div>
          <div className="text-[10px] mt-1">This week: 4</div>
        </div>

        {/* Calories */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">CALORIES</div>
          <div className="text-base font-bold">2,145</div>
          <div className="text-[10px] mt-1">+145 cal</div>
        </div>

        {/* Mood */}
        <div className="border-2 border-black p-2">
          <div className="text-[10px] mb-1">MOOD</div>
          <div className="text-base font-bold">Good</div>
          <div className="text-[10px] mt-1">Avg: 4.2/5</div>
        </div>
      </div>
    </div>
  );
}

function GitHubDashboard() {
  return (
    <div className="p-4 space-y-3 bg-white text-black" style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="text-sm font-bold">@fberrez</div>
        <div className="text-sm">{getCurrentDate()}</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="border-2 border-black p-2 text-center">
          <div className="text-sm font-bold">24</div>
          <div className="text-[10px]">PRs</div>
        </div>
        <div className="border-2 border-black p-2 text-center">
          <div className="text-sm font-bold">42</div>
          <div className="text-[10px]">Merged</div>
        </div>
        <div className="border-2 border-black p-2 text-center">
          <div className="text-sm font-bold">18</div>
          <div className="text-[10px]">Issues</div>
        </div>
        <div className="border-2 border-black p-2 text-center">
          <div className="text-sm font-bold">312</div>
          <div className="text-[10px]">Commits</div>
        </div>
      </div>

      {/* Contribution Graph */}
      <div className="border-2 border-black p-2">
        <div className="text-[10px] mb-2">CONTRIBUTIONS (7 days)</div>
        <div className="flex items-end gap-1 h-12">
          {[8, 12, 5, 15, 9, 11, 7].map((height, i) => {
            const now = new Date();
            // Calculate day index for last 7 days (6 days ago to today)
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() - (6 - i));
            const dayIndex = targetDate.getDay();
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="text-[10px] mb-1">{height}</div>
                <div
                  className="w-full bg-black"
                  style={{ height: `${(height / 15) * 100}%` }}
                />
                <div className="text-[10px] mt-1">{dayNames[dayIndex]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border-2 border-black p-2">
        <div className="text-[10px] mb-2">RECENT ACTIVITY</div>
        <div className="space-y-1 text-[10px]">
          <div>• Merged PR: fix auth bug</div>
          <div>• Opened Issue: dark mode</div>
          <div>• Pushed 3 commits to main</div>
        </div>
      </div>
    </div>
  );
}

function PortfolioDashboard() {
  return (
    <div className="p-4 space-y-3 bg-white text-black" style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="text-sm font-bold">PORTFOLIO</div>
        <div className="text-sm">{getCurrentTime()}</div>
      </div>

      {/* Portfolio Value */}
      <div>
        <div className="text-xl font-bold">€42,350.00</div>
        <div className="text-[10px]">+€245 (+0.58%)</div>
        <div className="text-[10px] mt-1">+€3,150 (+8.04%)</div>
      </div>

      {/* Holdings Table */}
      <div className="border-2 border-black">
        <div className="grid grid-cols-5 gap-1 border-b border-black p-1 text-[10px] font-bold">
          <div>TICKER</div>
          <div>QTY</div>
          <div>VALUE</div>
          <div>%</div>
          <div>CHG</div>
        </div>
        <div className="space-y-1 p-1">
          {[
            ['LVMH', '45', '€6,200', '14.6%', '+2.3%'],
            ['TotalEn', '120', '€5,800', '13.7%', '-1.2%'],
            ['Sanofi', '80', '€4,500', '10.6%', '+0.8%'],
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-5 gap-1 text-[10px]">
              {row.map((cell, j) => (
                <div key={j}>{cell}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MorningDashboard() {
  return (
    <div className="p-4 space-y-3 bg-white text-black" style={{ fontFamily: 'monospace' }}>
      {/* Time */}
      <div className="text-center">
        <div className="text-3xl font-bold">{getCurrentTime()}</div>
        <div className="text-sm">{getCurrentDateLong()}</div>
      </div>

      <div className="border-t-2 border-black pt-2" />

      {/* Weather & Calendar */}
      <div className="grid grid-cols-2 gap-2">
        {/* Weather */}
        <div className="border-2 border-black p-2">
          <div className="text-sm font-bold mb-1">WEATHER</div>
          <div className="text-xl font-bold">19°</div>
          <div className="text-[10px] mt-1">Partly Cloudy</div>
          <div className="text-[10px]">Humidity: 65%</div>
        </div>

        {/* Calendar */}
        <div className="border-2 border-black p-2">
          <div className="text-sm font-bold mb-1">TODAY</div>
          <div className="space-y-1 text-[10px]">
            <div>09:30 Team Standup</div>
            <div>11:00 Client Meeting</div>
            <div>12:30 Lunch</div>
          </div>
        </div>
      </div>
    </div>
  );
}

