import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private readonly logger = new Logger(ResendService.name);
  private readonly resend: Resend;
  private readonly audienceId: string;
  private readonly marketingUrl: string;
  private readonly fromEmail: string;
  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey || apiKey === 'your-resend-api-key-here') {
      this.logger.warn('RESEND_API_KEY not configured. Email functionality will not work.');
    }
    this.resend = new Resend(apiKey);
    this.audienceId = this.configService.get<string>('RESEND_AUDIENCE_ID');
    this.marketingUrl = this.configService.get<string>('MARKETING_URL');
    this.fromEmail = 'QuietDash <hello@quietdash.com>';
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.marketingUrl}/verify?token=${token}`;

    try {
      await this.retryOperation(() =>
        this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject: 'Verify your email for QuietDash waitlist',
          html: this.getVerificationEmailTemplate(verificationUrl),
        }),
      );

      this.logger.log(`Verification email sent to: ${email}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send verification email to ${email}: ${errorMessage}`);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    try {
      await this.retryOperation(() =>
        this.resend.emails.send({
          from: this.fromEmail,
          to: email,
          subject: 'Welcome to QuietDash! 🎉',
          html: this.getWelcomeEmailTemplate(),
        }),
      );

      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send welcome email to ${email}: ${errorMessage}`);
      throw error;
    }
  }

  async addToAudience(email: string): Promise<void> {
    try {
      await this.retryOperation(() =>
        this.resend.contacts.create({
          email,
          audienceId: this.audienceId,
        }),
      );

      this.logger.log(`Added ${email} to Resend audience`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Check if contact already exists in Resend
      if (errorMessage.includes('already exists')) {
        this.logger.log(`${email} already exists in Resend audience`);
        return;
      }
      this.logger.error(`Failed to add ${email} to Resend audience: ${errorMessage}`);
      throw error;
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error = new Error('Operation failed after retries');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(`Operation failed (attempt ${attempt}/${maxRetries}): ${errorMessage}`);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }

    throw lastError;
  }

  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">QuietDash</h1>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #666;">Your personal e-ink dashboard</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1a1a1a;">Verify your email address</h2>
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #333;">
                        Thank you for joining the QuietDash waitlist! We're excited to have you on board.
                      </p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #333;">
                        Please click the button below to verify your email address and confirm your spot:
                      </p>

                      <!-- Button -->
                      <table role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 6px; background-color: #000000;">
                            <a href="${verificationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #666;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 8px 0 0; font-size: 14px; color: #0066cc; word-break: break-all;">
                        ${verificationUrl}
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999;">
                        If you didn't sign up for QuietDash, you can safely ignore this email.
                      </p>
                      <p style="margin: 12px 0 0; font-size: 12px; line-height: 18px; color: #999;">
                        © ${new Date().getFullYear()} QuietDash. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private getWelcomeEmailTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to QuietDash!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #1a1a1a;">🎉</h1>
                      <h2 style="margin: 16px 0 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Welcome to QuietDash!</h2>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 20px 40px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #333;">
                        You're officially on the waitlist! Thank you for your interest in QuietDash.
                      </p>

                      <h3 style="margin: 24px 0 12px; font-size: 18px; font-weight: 600; color: #1a1a1a;">What's Next?</h3>

                      <ul style="margin: 0; padding-left: 20px; font-size: 16px; line-height: 28px; color: #333;">
                        <li>We're working hard to bring QuietDash to life</li>
                        <li>You'll be among the first to know when we launch</li>
                        <li>We'll send you exclusive updates and early access opportunities</li>
                        <li>Your feedback will help shape the future of QuietDash</li>
                      </ul>

                      <h3 style="margin: 24px 0 12px; font-size: 18px; font-weight: 600; color: #1a1a1a;">What is QuietDash?</h3>

                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #333;">
                        QuietDash is a customizable e-ink dashboard that brings your most important information to a beautiful, distraction-free display. Perfect for your desk, nightstand, or anywhere you need quick access to what matters most.
                      </p>

                      <p style="margin: 24px 0 0; font-size: 16px; line-height: 24px; color: #333;">
                        Stay tuned for updates!
                      </p>

                      <p style="margin: 16px 0 0; font-size: 16px; line-height: 24px; color: #333;">
                        <strong>The QuietDash Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999;">
                        You're receiving this email because you joined the QuietDash waitlist.
                      </p>
                      <p style="margin: 12px 0 0; font-size: 12px; line-height: 18px; color: #999;">
                        © ${new Date().getFullYear()} QuietDash. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}
