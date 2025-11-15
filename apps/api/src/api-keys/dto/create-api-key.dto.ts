import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { SERVICE_PROVIDERS } from '@quietdash/shared';

const validProviders = Object.values(SERVICE_PROVIDERS);

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'openweathermap',
    description: 'Service provider',
    enum: validProviders,
  })
  @IsString()
  @IsIn(validProviders)
  provider: string;

  @ApiProperty({
    example: 'your-api-key-here',
    description: 'API key for the service',
  })
  @IsString()
  apiKey: string;
}
