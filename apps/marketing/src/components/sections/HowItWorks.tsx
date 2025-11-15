import { Card, CardContent } from '@/components/ui/card';
import { Link, Settings, MapPin } from 'lucide-react';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';

const steps = [
  {
    icon: Link,
    step: '01',
    title: 'Connect',
    description:
      'Link your data sources through secure API connections. Apple Health, GitHub, Todoist, Slack—whatever metrics actually matter to you.',
  },
  {
    icon: Settings,
    step: '02',
    title: 'Configure',
    description:
      'Choose from pre-built dashboards or customize your layout. No coding required (but developers can dig into the open-source code if they want).',
  },
  {
    icon: MapPin,
    step: '03',
    title: 'Place & Forget',
    description:
      'Plug it in, put it on your desk. Updates every 30 minutes automatically. Battery backup lasts months if you unplug it.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Three steps from delivery to dashboard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple setup, powerful results. No technical expertise required.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

          <div className="grid gap-8 md:grid-cols-3 relative items-stretch">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const { ref, isVisible } = useScrollFadeIn({ threshold: 0.2 });
              return (
                <div
                  key={index}
                  ref={ref}
                  className={`relative h-full transition-opacity duration-1000 ease-out ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <Card className="relative overflow-hidden border-2 transition-all hover:shadow-xl hover:border-primary/50 hover:scale-[1.02] group bg-background h-full flex flex-col">
                    <CardContent className="p-8 flex-1 flex flex-col">
                      <div className="space-y-6 flex-1 flex flex-col">
                        {/* Icon */}
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-colors" />
                            <div className="relative rounded-xl bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-3 flex-1">
                          <h3 className="text-2xl font-bold tracking-tight">{step.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>

                    {/* Decorative gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </Card>

                  {/* Step number badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg border-4 border-background">
                    {step.step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
