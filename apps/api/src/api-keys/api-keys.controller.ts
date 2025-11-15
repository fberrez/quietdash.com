import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSafe, ApiKeySafe } from '@quietdash/shared';

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({
    status: 201,
    description: 'API key successfully created',
  })
  @ApiResponse({
    status: 409,
    description: 'API key for this provider already exists',
  })
  create(
    @CurrentUser() user: UserSafe,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ): Promise<ApiKeySafe> {
    return this.apiKeysService.create(user.id, createApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
  })
  findAll(@CurrentUser() user: UserSafe): Promise<ApiKeySafe[]> {
    return this.apiKeysService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID' })
  @ApiResponse({
    status: 200,
    description: 'API key found',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  findOne(
    @CurrentUser() user: UserSafe,
    @Param('id') id: string,
  ): Promise<ApiKeySafe> {
    return this.apiKeysService.findOne(user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update API key' })
  @ApiResponse({
    status: 200,
    description: 'API key successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  update(
    @CurrentUser() user: UserSafe,
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ): Promise<ApiKeySafe> {
    return this.apiKeysService.update(user.id, id, updateApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  @ApiResponse({
    status: 204,
    description: 'API key successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'API key not found',
  })
  async remove(
    @CurrentUser() user: UserSafe,
    @Param('id') id: string,
  ): Promise<void> {
    await this.apiKeysService.remove(user.id, id);
  }
}
