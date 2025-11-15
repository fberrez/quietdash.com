import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedToResend, setAddedToResend] = useState(false);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="max-w-md w-full">
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
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                      Email Verified!
                    </h2>
                    <p className="text-muted-foreground">
                      You're now on the QuietDash waitlist.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h3 className="font-medium text-sm">What's next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>You'll receive updates about our launch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Early access to pre-orders in February 2025</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Exclusive early backer benefits</span>
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
                  <Button className="w-full">
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
