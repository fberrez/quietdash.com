import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResendService } from './resend.service';
import { randomBytes } from 'crypto';
import {
  WaitlistResponseDto,
  VerifyResponseDto,
} from './dto/waitlist-response.dto';

@Injectable()
export class WaitlistService {
  private readonly logger = new Logger(WaitlistService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resendService: ResendService,
  ) {}

  async joinWaitlist(email: string): Promise<WaitlistResponseDto> {
    // Check if email already exists
    const existing = await this.prisma.waitlistEntry.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      if (existing.isVerified) {
        throw new Error(
          "You're already on the waitlist! We'll notify you when we launch.",
        );
      } else {
        // Resend verification email
        await this.resendService.sendVerificationEmail(
          email,
          existing.verificationToken,
        );
        return {
          message: 'Verification email resent. Please check your inbox.',
          email: email.toLowerCase(),
        };
      }
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Create waitlist entry
    await this.prisma.waitlistEntry.create({
      data: {
        email: email.toLowerCase(),
        verificationToken,
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

    // Update entry as verified
    await this.prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to add ${entry.email} to Resend: ${errorMessage}`,
      );
      // Don't fail the verification if Resend fails
    }

    // Send welcome email
    try {
      await this.resendService.sendWelcomeEmail(entry.email);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send welcome email to ${entry.email}: ${errorMessage}`,
      );
      // Don't fail the verification if welcome email fails
    }

    this.logger.log(`Email verified for: ${entry.email}`);

    return {
      message: 'Email verified successfully! Welcome to the waitlist.',
      addedToResend,
    };
  }
}
