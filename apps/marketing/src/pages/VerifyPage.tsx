import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, Share2 } from 'lucide-react';
import { ReferralDashboard } from '@/components/ReferralDashboard';
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { trackWaitlistVerificationCompleted } from '@/lib/plausible';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ReferralStats {
  email: string;
  referralCode: string;
  referralCount: number;
  queuePosition: number;
  rewardTier: 'none' | 'bronze' | 'silver' | 'gold';
  referralUrl: string;
}

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedToResend, setAddedToResend] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid verification link. No token provided.');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/waitlist/verify/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        setSuccess(true);
        setAddedToResend(data.addedToResend);

        // Check if this is a referral (from URL param)
        const urlParams = new URLSearchParams(window.location.search);
        const referredBy = urlParams.get('ref');

        // Track verification completion
        trackWaitlistVerificationCompleted(!!referredBy);

        // Fetch referral stats
        try {
          const statsResponse = await fetch(`${API_BASE_URL}/waitlist/referrals/${token}`);
          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            setReferralStats(stats);
          }
        } catch (err) {
          console.error('Failed to fetch referral stats:', err);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-background border rounded-lg shadow-lg p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">QuietDash</h1>
            <p className="text-sm text-muted-foreground">Email Verification</p>
          </div>

          {/* Status */}
          <div className="space-y-4">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            )}

            {success && (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-in zoom-in duration-300">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                      Email Verified!
                    </h2>
                    <p className="text-muted-foreground">You're now on the QuietDash waitlist.</p>
                    {referralStats && (
                      <p className="text-sm font-medium text-primary">
                        You're #{referralStats.queuePosition} in line!
                      </p>
                    )}
                  </div>
                </div>

                {/* Referral Dashboard */}
                {referralStats && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ReferralDashboard
                      referralCount={referralStats.referralCount}
                      queuePosition={referralStats.queuePosition}
                      rewardTier={referralStats.rewardTier}
                    />
                  </div>
                )}

                {/* Share Section */}
                {referralStats && (
                  <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Share2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Invite Friends & Earn Rewards</h3>
                        <p className="text-sm text-muted-foreground">
                          Share your unique link to unlock benefits
                        </p>
                      </div>
                    </div>

                    <SocialShareButtons
                      referralUrl={referralStats.referralUrl}
                      referralCode={referralStats.referralCode}
                    />
                  </Card>
                )}

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h3 className="font-medium text-sm">What's next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>You'll receive updates about our launch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Early access to pre-orders in February 2026</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Exclusive early backer benefits (early bird discount + more)</span>
                    </li>
                    {addedToResend && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Added to our mailing list</span>
                      </li>
                    )}
                  </ul>
                </div>

                <Link to="/" className="block">
                  <Button className="w-full" variant="outline">
                    Back to Homepage
                  </Button>
                </Link>
              </div>
            )}

            {error && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                      Verification Failed
                    </h2>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                  This verification link may have expired or is invalid. Please try signing up again
                  from the homepage.
                </div>

                <Link to="/#waitlist" className="block">
                  <Button className="w-full" variant="outline">
                    Back to Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} QuietDash. All rights reserved.
        </p>
      </div>
    </div>
  );
}
