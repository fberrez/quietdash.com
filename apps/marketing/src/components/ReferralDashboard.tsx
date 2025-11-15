import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, Gift, Zap } from 'lucide-react';

interface ReferralDashboardProps {
  referralCount: number;
  queuePosition: number;
  rewardTier: 'none' | 'bronze' | 'silver' | 'gold';
}

const REWARD_TIERS = [
  {
    name: 'bronze',
    threshold: 3,
    icon: Trophy,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    benefits: [
      'Move up 50 spots in queue',
      'Priority setup support',
    ],
  },
  {
    name: 'silver',
    threshold: 5,
    icon: Gift,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    benefits: [
      'All Bronze benefits',
      '+€10 discount (€30 total)',
    ],
  },
  {
    name: 'gold',
    threshold: 10,
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    benefits: [
      'All Silver benefits',
      'Free premium support for 1 year',
    ],
  },
];

export function ReferralDashboard({ referralCount, queuePosition, rewardTier }: ReferralDashboardProps) {
  // Calculate progress to next tier
  const getNextTier = () => {
    if (referralCount >= 10) return null;
    if (referralCount >= 5) return REWARD_TIERS[2];
    if (referralCount >= 3) return REWARD_TIERS[1];
    return REWARD_TIERS[0];
  };

  const nextTier = getNextTier();
  const progress = nextTier
    ? (referralCount / nextTier.threshold) * 100
    : 100;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Queue Position</p>
              <p className="text-2xl font-bold">#{queuePosition}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Referrals</p>
              <p className="text-2xl font-bold">{referralCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Reward Tier */}
      {rewardTier !== 'none' && (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {rewardTier} Tier
            </Badge>
            <p className="text-sm text-muted-foreground">
              You've unlocked special rewards!
            </p>
          </div>
        </Card>
      )}

      {/* Progress to Next Tier */}
      {nextTier && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <nextTier.icon className={`h-5 w-5 ${nextTier.color}`} />
              <h3 className="font-semibold capitalize">{nextTier.name} Tier</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {referralCount}/{nextTier.threshold} referrals
            </span>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="space-y-2">
            <p className="text-sm font-medium">Unlock benefits:</p>
            <ul className="space-y-1.5">
              {nextTier.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <svg className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground pt-2 border-t">
            {nextTier.threshold - referralCount} more{' '}
            {nextTier.threshold - referralCount === 1 ? 'referral' : 'referrals'} needed
          </p>
        </Card>
      )}

      {/* All Tiers Unlocked */}
      {!nextTier && referralCount >= 10 && (
        <Card className="p-6 text-center space-y-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold">Maximum Rewards Unlocked!</h3>
          <p className="text-sm text-muted-foreground">
            You've earned all available rewards. Thank you for spreading the word!
          </p>
          <ul className="space-y-1.5 pt-2">
            <li className="flex items-center gap-2 justify-center text-sm">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Priority queue access</span>
            </li>
            <li className="flex items-center gap-2 justify-center text-sm">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>€30 total discount</span>
            </li>
            <li className="flex items-center gap-2 justify-center text-sm">
              <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Free premium support for 1 year</span>
            </li>
          </ul>
        </Card>
      )}

      {/* How It Works */}
      <Card className="p-4 bg-muted/30">
        <h4 className="text-sm font-semibold mb-3">How referral rewards work:</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="font-semibold text-foreground">1.</span>
            <span>Share your unique referral link with friends</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground">2.</span>
            <span>They sign up and verify their email</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-foreground">3.</span>
            <span>You both unlock rewards as you reach each tier</span>
          </li>
        </ol>
      </Card>
    </div>
  );
}
