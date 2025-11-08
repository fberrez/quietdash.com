import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateApiKeyDto {
  @ApiProperty({
    example: 'your-new-api-key-here',
    description: 'New API key for the service',
  })
  @IsString()
  apiKey: string;
}
