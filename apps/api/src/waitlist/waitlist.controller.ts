import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import {
  WaitlistResponseDto,
  VerifyResponseDto,
} from './dto/waitlist-response.dto';
import {
  WaitlistStatsDto,
  ReferralStatsDto,
} from './dto/waitlist-stats.dto';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join the waitlist' })
  @ApiQuery({
    name: 'ref',
    required: false,
    description: 'Referral code from an existing member',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    type: WaitlistResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email or already on waitlist',
  })
  async joinWaitlist(
    @Body() joinWaitlistDto: JoinWaitlistDto,
    @Query('ref') referralCode?: string,
  ): Promise<WaitlistResponseDto> {
    try {
      return await this.waitlistService.joinWaitlist(
        joinWaitlistDto.email,
        referralCode,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('already')) {
        throw new BadRequestException(errorMessage);
      }
      throw error;
    }
  }

  @Get('verify/:token')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: 200,
    description: 'Email verified and added to waitlist',
    type: VerifyResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Invalid or expired verification token',
  })
  async verifyEmail(@Param('token') token: string): Promise<VerifyResponseDto> {
    const result = await this.waitlistService.verifyEmail(token);

    if (!result) {
      throw new NotFoundException(
        'Invalid or expired verification token. Please sign up again.',
      );
    }

    return result;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get real-time waitlist statistics' })
  @ApiResponse({
    status: 200,
    description: 'Waitlist statistics retrieved successfully',
    type: WaitlistStatsDto,
  })
  async getStats(): Promise<WaitlistStatsDto> {
    return await this.waitlistService.getStats();
  }

  @Get('referrals/:token')
  @ApiOperation({ summary: 'Get referral stats for a user by verification token' })
  @ApiResponse({
    status: 200,
    description: 'Referral statistics retrieved successfully',
    type: ReferralStatsDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found or not verified',
  })
  async getReferralStats(
    @Param('token') token: string,
  ): Promise<ReferralStatsDto> {
    const result = await this.waitlistService.getReferralStats(token);

    if (!result) {
      throw new NotFoundException(
        'User not found or not verified. Please verify your email first.',
      );
    }

    return result;
  }
}
