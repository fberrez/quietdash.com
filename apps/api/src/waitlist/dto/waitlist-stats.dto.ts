import { ApiProperty } from '@nestjs/swagger';

export class WaitlistStatsDto {
  @ApiProperty({
    description: 'Total number of verified waitlist entries',
    example: 47,
  })
  totalVerified: number;

  @ApiProperty({
    description: 'Number of people who joined today',
    example: 3,
  })
  joinedToday: number;

  @ApiProperty({
    description: 'Verification rate percentage',
    example: 94,
  })
  verificationRate: number;

  @ApiProperty({
    description: 'Total number of signups (verified + unverified)',
    example: 50,
  })
  totalSignups: number;
}

export class ReferralStatsDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Unique referral code',
    example: 'ABC123XYZ',
  })
  referralCode: string;

  @ApiProperty({
    description: 'Number of verified referrals',
    example: 5,
  })
  referralCount: number;

  @ApiProperty({
    description: 'Queue position in waitlist',
    example: 48,
  })
  queuePosition: number;

  @ApiProperty({
    description: 'Current reward tier unlocked',
    example: 'bronze',
  })
  rewardTier: 'none' | 'bronze' | 'silver' | 'gold';

  @ApiProperty({
    description: 'Referral URL to share',
    example: 'https://quietdash.com/?ref=ABC123XYZ',
  })
  referralUrl: string;
}
