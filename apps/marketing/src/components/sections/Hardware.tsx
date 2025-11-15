import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Battery, Eye, Clock } from 'lucide-react';
import { DashboardMockup } from '@/components/DashboardMockup';
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn';
import { useState, useEffect } from 'react';

const specs = [
  {
    icon: Monitor,
    label: 'Display',
    value: '7.5" E-Paper',
    detail: '800×480 resolution',
  },
  {
    icon: Battery,
    label: 'Battery Life',
    value: 'Months',
    detail: 'Between charges',
  },
  {
    icon: Eye,
    label: 'Technology',
    value: 'E-Paper',
    detail: 'No eye strain',
  },
  {
    icon: Clock,
    label: 'Updates',
    value: 'Every 5 min',
    detail: 'Configurable',
  },
];

export function Hardware() {
  const { ref: displayRef, isVisible } = useScrollFadeIn({ threshold: 0.3 });
  const [showFlash, setShowFlash] = useState(false);
  const [hasFlashed, setHasFlashed] = useState(false);

  useEffect(() => {
    if (isVisible && !hasFlashed) {
      // Trigger flash only once when first visible
      setShowFlash(true);
      setHasFlashed(true);
      // Remove flash overlay after animation completes
      const timer = setTimeout(() => {
        setShowFlash(false);
      }, 2100); // Slightly longer than animation to ensure it fades completely
      return () => clearTimeout(timer);
    }

    // Reset when scrolled out of view so it can flash again next time
    if (!isVisible && hasFlashed) {
      setHasFlashed(false);
      setShowFlash(false);
    }
  }, [isVisible, hasFlashed]);

  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Dashboard Mockup with Frame */}
          <div className="order-2 lg:order-1" ref={displayRef}>
            <div className="relative">
              {/* Device Frame */}
              <div className="bg-gray-800 rounded-2xl p-4 shadow-2xl">
                {/* Bezel */}
                <div className="bg-gray-900 rounded-lg p-3 relative">
                  {/* Screen */}
                  <div className="bg-white rounded border-4 border-gray-800 overflow-hidden shadow-inner">
                    <div className="aspect-[800/480] relative overflow-hidden">
                      {/* E-ink flash overlay - constrained to screen content area */}
                      {showFlash && (
                        <div
                          className="absolute inset-0 bg-white pointer-events-none animate-eink-flash"
                          style={{
                            zIndex: 10,
                            borderRadius: '0',
                          }}
                        />
                      )}
                      <DashboardMockup type="health" className="w-full h-full relative z-0" />
                    </div>
                  </div>
                </div>
                {/* Stand/Base indicator */}
                <div className="mt-2 h-1 bg-gray-700 rounded-full mx-auto w-1/3" />
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 -bottom-8 -right-8 h-full w-full rounded-2xl bg-primary/5 blur-sm" />
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="text-sm">
                Hardware Excellence
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Built for E-Paper Excellence
              </h2>
              <p className="text-lg text-muted-foreground">
                Designed specifically for industry-leading e-Paper displays. Enjoy paper-like
                readability with zero eye strain and exceptional battery life.
              </p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
              {specs.map((spec, index) => {
                const Icon = spec.icon;
                return (
                  <Card key={index} className="border-2 transition-all hover:border-primary/50">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="rounded bg-primary/10 p-1.5">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {spec.label}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-lg font-bold">{spec.value}</p>
                        <p className="text-xs text-muted-foreground">{spec.detail}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Key Benefits */}
            <div className="space-y-3">
              {[
                'Paper-like reading experience',
                'Always-on without screen burn-in',
                'Works perfectly in bright sunlight',
                'Minimal power consumption',
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-1">
                    <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
