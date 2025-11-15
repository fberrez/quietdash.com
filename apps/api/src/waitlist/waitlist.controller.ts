import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import {
  WaitlistResponseDto,
  VerifyResponseDto,
} from './dto/waitlist-response.dto';

@ApiTags('waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join the waitlist' })
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
  ): Promise<WaitlistResponseDto> {
    try {
      return await this.waitlistService.joinWaitlist(joinWaitlistDto.email);
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
}
