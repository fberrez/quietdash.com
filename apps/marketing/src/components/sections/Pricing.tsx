import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'DIY Kit',
    description: 'For tinkerers',
    badge: null,
    features: [
      'Raspberry Pi Zero 2 W',
      '7.5" e-ink display',
      'Power supply + cables',
      'Wooden frame kit (assembly required, 30 min)',
      'Pre-configured microSD card',
      'Lifetime software updates',
    ],
    bestFor: 'Developers, makers, anyone comfortable with Raspberry Pi setup',
    cta: 'Join Waitlist',
    highlighted: false,
  },
  {
    name: 'Assembled',
    description: 'Plug and play',
    badge: 'Most Popular',
    features: [
      'Pre-assembled hardware',
      'Pre-configured with chosen dashboard',
      'Premium wooden frame (walnut or oak)',
      'Cable management included',
      'Plug in, enter Wi-Fi, done',
      'Priority setup assistance',
    ],
    bestFor: 'Knowledge workers who want it working immediately',
    cta: 'Join Waitlist',
    highlighted: true,
  },
  {
    name: 'Cloud Service',
    description: 'Coming Q2 2025',
    badge: 'No-Code',
    features: [
      'Assembled hardware included',
      'Cloud dashboard builder',
      'No technical knowledge required',
      'Web-based configuration',
      'Hosted API proxy',
      'Centralized team management',
    ],
    bestFor: 'Non-technical users, teams needing centralized control',
    cta: 'Notify Me',
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Choose Your Kit
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From DIY enthusiasts to plug-and-play convenience, we have an option for everyone
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative overflow-hidden transition-all ${
                plan.highlighted
                  ? 'border-primary shadow-xl scale-105 lg:scale-110'
                  : 'border-2 hover:border-primary/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg px-3 py-1">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="space-y-4 pb-8">
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Best For */}
                <div className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-4">
                  <span className="font-semibold text-foreground not-italic">Best for:</span> {plan.bestFor}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  size="lg"
                  asChild
                >
                  <a href="#waitlist">{plan.cta}</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Pricing details coming soon. Join the waitlist to be notified when pre-orders open.
          </p>
          <p className="text-xs text-muted-foreground">
            DIY and Assembled kits include lifetime software updates. No subscriptions required for basic features. Cloud service is entirely optional—local-only version is fully functional.
          </p>
        </div>
      </div>
    </section>
  );
}
