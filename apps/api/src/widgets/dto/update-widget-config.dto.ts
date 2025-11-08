import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class WidgetPositionDto {
  @ApiProperty({ example: 20 })
  x: number;

  @ApiProperty({ example: 90 })
  y: number;

  @ApiProperty({ example: 360 })
  width: number;

  @ApiProperty({ example: 150 })
  height: number;
}

export class UpdateWidgetConfigDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    example: { x: 20, y: 90, width: 360, height: 150 },
    required: false,
  })
  @ValidateNested()
  @Type(() => WidgetPositionDto)
  @IsOptional()
  position?: WidgetPositionDto;

  @ApiProperty({
    example: {},
    description: 'Widget-specific settings',
    required: false,
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;
}
