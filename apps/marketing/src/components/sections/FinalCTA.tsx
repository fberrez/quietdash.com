import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle, Users, TrendingUp, Clock } from 'lucide-react';
import { getHeadlineCopy, getCTAButtonCopy, shouldShowCountdown } from '@/lib/experiments';
import {
  trackWaitlistFormViewed,
  trackWaitlistFormSubmitted,
} from '@/lib/plausible';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface WaitlistStats {
  totalVerified: number;
  joinedToday: number;
  verificationRate: number;
  totalSignups: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function FinalCTA() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTrackedView = useRef(false);

  // Get A/B test variants
  const headlineCopy = getHeadlineCopy();
  const ctaButtonCopy = getCTAButtonCopy();
  const showCountdown = shouldShowCountdown();

  // Get referral code from URL
  const getReferralCode = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('ref');
  };

  // Fetch real-time waitlist stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/waitlist/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch waitlist stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer to launch date
  useEffect(() => {
    if (!showCountdown) return;

    const calculateTimeLeft = (): TimeLeft => {
      // Set target date to February 1, 2026 (update this as needed)
      const targetDate = new Date('2026-02-01T00:00:00').getTime();
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [showCountdown]);

  // Track form view when it comes into viewport
  useEffect(() => {
    if (hasTrackedView.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          trackWaitlistFormViewed();
          hasTrackedView.current = true;
        }
      },
      { threshold: 0.5 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Get referral code from URL if present
      const referralCode = getReferralCode();
      const url = new URL(`${API_BASE_URL}/waitlist`);
      if (referralCode) {
        url.searchParams.set('ref', referralCode);
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong. Please try again.');
      }

      // Track successful submission
      trackWaitlistFormSubmitted();

      setSuccess(true);
      setEmail('');

      // Calculate estimated queue position
      if (stats) {
        setQueuePosition(stats.totalSignups + 1);
      }

      // Refresh stats after successful signup
      const statsResponse = await fetch(`${API_BASE_URL}/waitlist/stats`);
      if (statsResponse.ok) {
        const updatedStats = await statsResponse.json();
        setStats(updatedStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      className="py-20 sm:py-32 bg-gradient-to-b from-background to-muted/30"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Urgency Badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-1.5 animate-in fade-in slide-in-from-top-2 duration-500">
              {headlineCopy}
            </Badge>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {headlineCopy}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pre-orders open February 2026. Join the waitlist to get notified before public launch.
            </p>

            {/* Countdown Timer (A/B Test) */}
            {showCountdown && timeLeft && (
              <div className="flex justify-center pt-4 animate-in fade-in duration-500 delay-200">
                <div className="inline-flex items-center gap-4 px-6 py-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Pre-orders open in:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums text-foreground">
                        {timeLeft.days}
                      </div>
                      <div className="text-xs text-muted-foreground">days</div>
                    </div>
                    <span className="text-xl text-muted-foreground">:</span>
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums text-foreground">
                        {String(timeLeft.hours).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-muted-foreground">hours</div>
                    </div>
                    <span className="text-xl text-muted-foreground">:</span>
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums text-foreground">
                        {String(timeLeft.minutes).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-muted-foreground">mins</div>
                    </div>
                    <span className="text-xl text-muted-foreground">:</span>
                    <div className="text-center">
                      <div className="text-2xl font-bold tabular-nums text-foreground">
                        {String(timeLeft.seconds).padStart(2, '0')}
                      </div>
                      <div className="text-xs text-muted-foreground">secs</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Stats */}
            {!statsLoading && stats && stats.totalVerified > 0 && (
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-2 animate-in fade-in duration-500 delay-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{stats.totalVerified}</span>
                  <span>verified early backers</span>
                </div>
                {stats.joinedToday > 0 && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-foreground">{stats.joinedToday}</span>
                      <span>joined today</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Email Waitlist Form */}
          <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-500 delay-200">
            {success ? (
              <div className="space-y-3 animate-in zoom-in duration-300">
                <div className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="text-left flex-1">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      Check your email to verify your address!
                    </p>
                    {queuePosition && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        You're #{queuePosition} in line!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
                  <div className="relative flex-[2] min-w-0">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-12 text-base transition-all focus:ring-2 focus:ring-primary/20"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="text-sm sm:text-base group h-12 px-4 sm:px-6 transition-all hover:scale-105 whitespace-nowrap"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      <>
                        {ctaButtonCopy}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
              </>
            )}

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
                <span>Early bird discount</span>
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
