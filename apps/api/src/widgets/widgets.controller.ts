import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WidgetsService } from './widgets.service';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSafe, WidgetConfig } from '@vitrine/shared';

@ApiTags('Widgets')
@Controller('widgets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class WidgetsController {
  constructor(private readonly widgetsService: WidgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new widget configuration' })
  @ApiResponse({
    status: 201,
    description: 'Widget config successfully created',
  })
  @ApiResponse({
    status: 409,
    description: 'Widget of this type already exists',
  })
  create(
    @CurrentUser() user: UserSafe,
    @Body() createWidgetConfigDto: CreateWidgetConfigDto,
  ): Promise<WidgetConfig> {
    return this.widgetsService.create(user.id, createWidgetConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all widget configurations' })
  @ApiResponse({
    status: 200,
    description: 'List of widget configs',
  })
  findAll(@CurrentUser() user: UserSafe): Promise<WidgetConfig[]> {
    return this.widgetsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get widget configuration by ID' })
  @ApiResponse({
    status: 200,
    description: 'Widget config found',
  })
  @ApiResponse({
    status: 404,
    description: 'Widget config not found',
  })
  findOne(
    @CurrentUser() user: UserSafe,
    @Param('id') id: string,
  ): Promise<WidgetConfig> {
    return this.widgetsService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update widget configuration' })
  @ApiResponse({
    status: 200,
    description: 'Widget config successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Widget config not found',
  })
  update(
    @CurrentUser() user: UserSafe,
    @Param('id') id: string,
    @Body() updateWidgetConfigDto: UpdateWidgetConfigDto,
  ): Promise<WidgetConfig> {
    return this.widgetsService.update(user.id, id, updateWidgetConfigDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete widget configuration' })
  @ApiResponse({
    status: 204,
    description: 'Widget config successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Widget config not found',
  })
  async remove(
    @CurrentUser() user: UserSafe,
    @Param('id') id: string,
  ): Promise<void> {
    await this.widgetsService.remove(user.id, id);
  }
}
