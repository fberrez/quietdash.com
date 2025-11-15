import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';
import {
  Timer,
  Heart,
  Sunrise,
  Github,
  TrendingUp,
  Train,
  Monitor,
  FileText,
} from 'lucide-react';

const dashboards = [
  {
    icon: Timer,
    title: 'Productivity Dashboard',
    description: 'Track Pomodoro sessions, daily goals, unread messages, deep work hours, and priority todos',
    features: ['Pomodoro Timer', 'Daily Goals', 'Email/Slack Unread', 'Deep Work Tracking', 'Priority Todos'],
    tags: ['Work', 'Focus'],
    color: 'bg-blue-500',
  },
  {
    icon: Heart,
    title: 'Health Dashboard',
    description: 'Monitor steps, water intake, sleep quality, workout streaks, calories, and mood tracking',
    features: ['Steps & Activity', 'Water Intake', 'Sleep Score', 'Workout Streak', 'Calories', 'Mood Tracker'],
    tags: ['Health', 'Fitness'],
    color: 'bg-red-500',
  },
  {
    icon: Sunrise,
    title: 'Morning Routine',
    description: 'Start your day with time, weather conditions, and upcoming calendar events at a glance',
    features: ['Current Time', 'Weather Forecast', 'Calendar Events', 'Daily Quote'],
    tags: ['Personal', 'Daily'],
    color: 'bg-yellow-500',
  },
  {
    icon: Github,
    title: 'GitHub Stats',
    description: 'Track pull requests, issues, contribution graph, and recent activity across your repositories',
    features: ['PRs & Issues', 'Contribution Graph', 'Recent Activity', 'Commit Stats'],
    tags: ['Development', 'Code'],
    color: 'bg-gray-900',
  },
  {
    icon: TrendingUp,
    title: 'Portfolio Tracker',
    description: 'Monitor PEA portfolio value, daily changes, holdings allocation, and profit & loss',
    features: ['Portfolio Value', 'Daily P&L', 'Holdings Table', 'Sector Allocation'],
    tags: ['Finance', 'Investing'],
    color: 'bg-green-500',
  },
  {
    icon: Train,
    title: 'Train Schedule',
    description: 'Display upcoming SNCF train departures with times, destinations, platforms, and status',
    features: ['Upcoming Trains', 'Departure Times', 'Platform Numbers', 'Delay Status'],
    tags: ['Transport', 'Commute'],
    color: 'bg-purple-500',
  },
  {
    icon: Monitor,
    title: 'Projects Monitor',
    description: 'Track status, uptime, deployments, and metrics for all your side projects in one place',
    features: ['Project Status', 'Uptime %', 'Last Deployment', 'Revenue & Users'],
    tags: ['Development', 'Monitoring'],
    color: 'bg-indigo-500',
  },
  {
    icon: FileText,
    title: 'Word Count',
    description: 'Track your writing progress with total word count and a 7-day bar chart visualization',
    features: ['Total Word Count', '7-Day Chart', 'Daily Breakdown', 'Writing Streak'],
    tags: ['Writing', 'Productivity'],
    color: 'bg-orange-500',
  },
];

export function Dashboards() {
  const headerRef = useScrollFadeIn({ threshold: 0.2 });
  const { ref: headerRefValue, isVisible: headerIsVisible } = headerRef;

  return (
    <section id="dashboards" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div
          ref={headerRefValue}
          className={`text-center space-y-4 mb-16 transition-opacity duration-1000 ease-out ${
            headerIsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Pre-Built Dashboards
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from 8 ready-to-use dashboards, or create your own custom layout. Each dashboard is optimized for e-ink display with clear, minimal design.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboards.map((dashboard, index) => {
            const Icon = dashboard.icon;
            const { ref, isVisible } = useScrollFadeIn({ threshold: 0.2 });
            return (
              <Card
                key={index}
                ref={ref}
                className={`overflow-hidden border-2 hover:border-primary/50 group transition-all duration-500 ease-out ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(index % 4) * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`rounded-lg ${dashboard.color} p-2.5 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {dashboard.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{dashboard.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">
                    {dashboard.description}
                  </CardDescription>
                  <div className="space-y-1.5 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Features:</p>
                    <ul className="space-y-1">
                      {dashboard.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            All dashboards are fully customizable. Add, remove, or rearrange widgets to match your workflow.
          </p>
        </div>
      </div>
    </section>
  );
}

