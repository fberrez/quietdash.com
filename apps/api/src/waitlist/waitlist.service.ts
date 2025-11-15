import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResendService } from './resend.service';
import { randomBytes } from 'crypto';
import { WaitlistResponseDto, VerifyResponseDto } from './dto/waitlist-response.dto';
import { WaitlistStatsDto, ReferralStatsDto } from './dto/waitlist-stats.dto';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
  ) {}

  async joinWaitlist(email: string, referredBy?: string): Promise<WaitlistResponseDto> {
    // Check if email already exists
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.isVerified) {
        throw new Error("You're already on the waitlist! We'll notify you when we launch.");
      } else {
        // Resend verification email
        await this.resendService.sendVerificationEmail(email, existing.verificationToken);
        return {
          message: 'Verification email resent. Please check your inbox.',
          email: email.toLowerCase(),
        };
      }
    }

    // Validate referral code if provided
    if (referredBy) {
      const referrer = await this.prisma.waitlistEntry.findUnique({
        where: { referralCode: referredBy },
      });
      if (!referrer || !referrer.isVerified) {
        this.logger.warn(`Invalid or unverified referral code: ${referredBy}`);
        // Continue without referral if code is invalid
        referredBy = undefined;
      }
    }

    // Calculate queue position (count of verified + unverified entries + 1)
    const queuePosition = (await this.prisma.waitlistEntry.count()) + 1;

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Create waitlist entry
    await this.prisma.waitlistEntry.create({
      data: {
        email: email.toLowerCase(),
        verificationToken,
        referredBy: referredBy || null,
        queuePosition,
      },
    });

    // Send verification email
    await this.resendService.sendVerificationEmail(email, verificationToken);

    this.logger.log(`Waitlist entry created for: ${email}`);

    return {
      message: 'Please check your email to verify your address',
      email: email.toLowerCase(),
    };
  }

  async verifyEmail(token: string): Promise<VerifyResponseDto | null> {
    // Find entry by verification token
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { verificationToken: token },
    });

    if (!entry) {
      return null;
    }

    // If already verified, return success
    if (entry.isVerified) {
      return {
        message: "You're already verified and on the waitlist!",
        addedToResend: entry.syncedToResend,
      };
    }

    // Generate unique referral code
    const referralCode = this.generateReferralCode();

    // Update entry as verified
    await this.prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        referralCode,
      },
    });

    // If user was referred, increment referrer's count
    if (entry.referredBy) {
      try {
        await this.prisma.waitlistEntry.updateMany({
          where: {
            referralCode: entry.referredBy,
            isVerified: true,
          },
          data: {
            referralCount: {
              increment: 1,
            },
          },
        });
        this.logger.log(`Incremented referral count for code: ${entry.referredBy}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to increment referral count: ${errorMessage}`);
      }
    }

    // Add to Resend audience
    let addedToResend = false;
    try {
      await this.resendService.addToAudience(entry.email);
      await this.prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { syncedToResend: true },
      });
      addedToResend = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to add ${entry.email} to Resend: ${errorMessage}`);
      // Don't fail the verification if Resend fails
    }

    // Send welcome email
    try {
      await this.resendService.sendWelcomeEmail(entry.email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send welcome email to ${entry.email}: ${errorMessage}`);
      // Don't fail the verification if welcome email fails
    }

    this.logger.log(`Email verified for: ${entry.email}`);

    return {
      message: 'Email verified successfully! Welcome to the waitlist.',
      addedToResend,
    };
  }

  /**
   * Generate a unique short referral code
   */
  private generateReferralCode(): string {
    // Generate a short, URL-friendly code (8 characters)
    return randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Get real-time waitlist statistics
   */
  async getStats(): Promise<WaitlistStatsDto> {
    const [totalSignups, totalVerified, todayStart] = await Promise.all([
      this.prisma.waitlistEntry.count(),
      this.prisma.waitlistEntry.count({
        where: { isVerified: true },
      }),
      Promise.resolve(new Date(new Date().setHours(0, 0, 0, 0))),
    ]);

    const joinedToday = await this.prisma.waitlistEntry.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    const verificationRate =
      totalSignups > 0 ? Math.round((totalVerified / totalSignups) * 100) : 0;

    return {
      totalVerified,
      joinedToday,
      verificationRate,
      totalSignups,
    };
  }

  /**
   * Get referral stats for a specific user by verification token
   */
  async getReferralStats(verificationToken: string): Promise<ReferralStatsDto | null> {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { verificationToken },
    });

    if (!entry || !entry.isVerified || !entry.referralCode) {
      return null;
    }

    const rewardTier = this.calculateRewardTier(entry.referralCount);
    const baseUrl = 'https://quietdash.com';

    return {
      email: entry.email,
      referralCode: entry.referralCode,
      referralCount: entry.referralCount,
      queuePosition: entry.queuePosition || 0,
      rewardTier,
      referralUrl: `${baseUrl}/?ref=${entry.referralCode}`,
    };
  }

  /**
   * Calculate reward tier based on referral count
   */
  private calculateRewardTier(referralCount: number): 'none' | 'bronze' | 'silver' | 'gold' {
    if (referralCount >= 10) return 'gold';
    if (referralCount >= 5) return 'silver';
    if (referralCount >= 3) return 'bronze';
    return 'none';
  }
}
