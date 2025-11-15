import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sunrise, Target, Users, TrendingUp } from 'lucide-react';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';

const useCases = [
  {
    icon: Sunrise,
    title: 'Morning Routine Dashboard',
    description: 'Start your day right with weather, calendar, and news at a glance',
    tags: ['Personal', 'Daily'],
  },
  {
    icon: Target,
    title: 'Productivity Monitor',
    description: 'Track tasks, goals, and focus time without constant screen checking',
    tags: ['Work', 'GTD'],
  },
  {
    icon: Users,
    title: 'Family Command Center',
    description: 'Shared calendar, reminders, and schedules for the whole household',
    tags: ['Family', 'Shared'],
  },
  {
    icon: TrendingUp,
    title: 'Portfolio Tracker',
    description: 'Monitor stocks, crypto, and market news without distractions',
    tags: ['Finance', 'Markets'],
  },
];

export function UseCases() {
  const headerRef = useScrollFadeIn({ threshold: 0.2 });
  const { ref: headerRefValue, isVisible: headerIsVisible } = headerRef;

  return (
    <section className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div
          ref={headerRefValue}
          className={`text-center space-y-4 mb-16 transition-opacity duration-1000 ease-out ${
            headerIsVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Endless Possibilities
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From personal productivity to family organization, vitrine.io adapts to your lifestyle
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            const { ref, isVisible } = useScrollFadeIn({ threshold: 0.2 });
            return (
              <Card
                key={index}
                ref={ref}
                className={`overflow-hidden border-2 hover:border-primary/50 group transition-opacity duration-1000 ease-out ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{ transitionDelay: `${(index + 1) * 150}ms` }}
              >
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-5">
                    {/* Image Placeholder */}
                    <div className="md:col-span-2 aspect-square md:aspect-auto bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center border-r-2">
                      <div className="text-center space-y-2 p-6">
                        <div className="rounded-full bg-primary/10 w-20 h-20 mx-auto flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Lifestyle Image
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3 p-6 space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {useCase.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {useCase.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {useCase.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
