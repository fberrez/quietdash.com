import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export function FinalCTA() {
  return (
    <section id="waitlist" className="py-20 sm:py-32 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Urgency Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-1.5">
              First 100 backers get early access
            </Badge>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              First 100 backers get early access
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pre-orders open February 2025. Join the waitlist to get notified before public launch.
            </p>
          </div>

          {/* Email Waitlist Form */}
          <div className="max-w-md mx-auto space-y-4">
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="your@email.com"
                className="flex-1 h-12 text-base"
                required
              />
              <Button type="submit" size="lg" className="text-base group h-12 px-6">
                Reserve Your Spot
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground">
              We'll email you when pre-orders open. No spam, unsubscribe anytime.
            </p>
          </div>

          {/* Early Bird Benefits */}
          <div className="pt-8 space-y-4">
            <p className="text-sm font-semibold">Early backers will receive:</p>
            <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto text-sm">
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>€20 discount on any kit</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Priority setup support</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Private Discord access</span>
              </div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Input on roadmap</span>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground flex-wrap border-t pt-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>GDPR-compliant EU hosting</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Open-source software (MIT)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No VC funding, no growth-at-all-costs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
