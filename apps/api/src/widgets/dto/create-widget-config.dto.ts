import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsObject, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WIDGET_TYPES } from '@vitrine/shared';

const validWidgetTypes = Object.values(WIDGET_TYPES);

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

export class CreateWidgetConfigDto {
  @ApiProperty({
    example: 'weather',
    description: 'Widget type',
    enum: validWidgetTypes,
  })
  @IsString()
  @IsIn(validWidgetTypes)
  type: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({
    example: { x: 20, y: 90, width: 360, height: 150 },
  })
  @ValidateNested()
  @Type(() => WidgetPositionDto)
  position: WidgetPositionDto;

  @ApiProperty({
    example: {},
    description: 'Widget-specific settings',
  })
  @IsObject()
  settings: Record<string, any>;
}
