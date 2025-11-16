import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { DashboardCarousel } from '@/components/DashboardCarousel';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Stop checking your phone.{' '}
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Start seeing your progress.
                </span>
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl lg:text-2xl">
                An e-ink display that shows your productivity metrics, health data, and daily goals—without notifications, interruptions, or unlocking your phone 60 times a day.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" className="text-base group" asChild>
                <a href="#waitlist">
                  Join the Waitlist
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <a href="#how-it-works">
                  See How It Works
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="whitespace-nowrap">Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="whitespace-nowrap">Privacy-First</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="whitespace-nowrap">Self-Hosted</span>
              </div>
            </div>
          </div>

          {/* Dashboard Carousel */}
          <div className="relative overflow-hidden">
            <div className="aspect-[4/3] rounded-xl border-2 border-muted-foreground/25 bg-muted/50 p-3 sm:p-6 flex items-center justify-center shadow-lg">
              <div className="w-full h-full">
                <DashboardCarousel />
              </div>
            </div>

            {/* Decorative blur effect - hidden on mobile to prevent overflow */}
            <div className="hidden md:block absolute -z-10 -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
            <div className="hidden md:block absolute -z-10 -bottom-24 -left-24 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
