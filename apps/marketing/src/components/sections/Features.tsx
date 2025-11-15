import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Zap, Shield, CircleSlash } from 'lucide-react';

const features = [
  {
    icon: Bell,
    title: 'Information Without Interruption',
    description:
      'See your Pomodoro status, daily goals, and work metrics at a glance. No unlocking, no app switching, no notification fatigue. Just ambient awareness.',
    badge: 'Focused',
  },
  {
    icon: Zap,
    title: 'Flow-State Preservation',
    description:
      "When you're deep in work, you shouldn't have to break concentration to check progress. Glance left, confirm your streak is intact, return to your task.",
    badge: 'Productive',
  },
  {
    icon: Shield,
    title: 'Local-First Privacy',
    description:
      "Your data never touches our servers. VITRINE runs entirely on a Raspberry Pi on your desk. GDPR-compliant by design, because European privacy laws aren't optional features.",
    badge: 'Private',
  },
  {
    icon: CircleSlash,
    title: 'Anti-Productivity Theater',
    description:
      "This isn't another app promising to '10x your output.' It's a passive display that stops you from context-switching. The productivity gain comes from what you stop doing.",
    badge: 'Honest',
  },
];

export function Features() {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Your data, always visible. Never demanding attention.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            VITRINE is an e-ink dashboard that shows the information you keep checking for—without
            notifications, without interruptions, without breaking your flow.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden transition-all hover:shadow-lg group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary">{feature.badge}</Badge>
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>

                {/* Decorative hover effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
