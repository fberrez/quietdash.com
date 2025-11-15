import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Github, Code2, BookOpen, Users } from 'lucide-react';

const developerFeatures = [
  {
    icon: Github,
    title: 'Open Source',
    description: 'Full access to our codebase. Fork, modify, and contribute back to the community.',
  },
  {
    icon: Code2,
    title: 'Custom Widgets',
    description: 'Build your own widgets with our TypeScript API. Share them with the community.',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    description: 'Comprehensive guides, API references, and examples to get you started quickly.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Join developers building amazing dashboards. Share ideas and get support.',
  },
];

export function Developer() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="text-sm">
                <Code2 className="mr-2 h-3 w-3" />
                For Developers
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Hackers Welcome
              </h2>
              <p className="text-lg text-muted-foreground">
                Built by developers, for developers. Vitrine.io is completely open-source
                and designed to be extended, modified, and improved by the community.
              </p>
            </div>

            {/* Developer Features Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {developerFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground pl-10">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="default" size="lg" className="group" asChild>
                <a href="https://github.com/fberrez/vitrine.io" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="outline" size="lg" disabled className="cursor-not-allowed">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Read Documentation
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Work in progress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold">50+</p>
                <p className="text-xs text-muted-foreground">Custom Widgets</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">MIT</p>
                <p className="text-xs text-muted-foreground">License</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-muted-foreground">Open Source</p>
              </div>
            </div>
          </div>

          {/* Code Preview Card */}
          <div className="lg:order-1">
            <Card className="border-2 bg-muted/50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Example Widget</Badge>
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                  </div>
                </div>

                <pre className="text-xs bg-background rounded-lg p-4 overflow-x-auto border">
                  <code className="text-muted-foreground">
{`import { Widget } from '@vitrine/shared';

export const WeatherWidget: Widget = {
  id: 'weather',
  name: 'Weather',
  async render(ctx, config) {
    const data = await fetchWeather(
      config.location
    );

    ctx.fillText(
      \`\${data.temp}°C\`,
      config.x,
      config.y
    );
  }
};`}
                  </code>
                </pre>

                <p className="text-xs text-muted-foreground">
                  Create custom widgets with just a few lines of TypeScript
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
