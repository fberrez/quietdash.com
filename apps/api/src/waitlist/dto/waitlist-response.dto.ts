import { ApiProperty } from '@nestjs/swagger';

export class WaitlistResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Please check your email to verify your address',
  })
  message: string;

  @ApiProperty({
    description: 'Email address submitted',
    example: 'user@example.com',
  })
  email: string;
}

export class VerifyResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Email verified successfully! Welcome to the waitlist.',
  })
  message: string;

  @ApiProperty({
    description: 'Indicates if user was added to Resend',
    example: true,
  })
  addedToResend: boolean;
}
