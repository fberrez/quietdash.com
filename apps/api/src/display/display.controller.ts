import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { DisplayService } from './display.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserSafe } from '@vitrine/shared';

@ApiTags('Display')
@Controller('display')
export class DisplayController {
  constructor(private readonly displayService: DisplayService) {}

  @Get('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate display image' })
  @ApiResponse({
    status: 200,
    description: 'PNG image for e-ink display (800x480)',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async getDisplayImage(
    @CurrentUser() user: UserSafe,
    @Res() res: Response,
  ): Promise<void> {
    const imageBuffer = await this.displayService.generateImage(user.id);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'no-cache',
    });

    res.send(imageBuffer);
  }

  @Get('preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Preview display image in browser' })
  @ApiResponse({
    status: 200,
    description: 'PNG image preview',
    content: {
      'image/png': {},
    },
  })
  async getPreview(
    @CurrentUser() user: UserSafe,
    @Res() res: Response,
  ): Promise<void> {
    const imageBuffer = await this.displayService.generateImage(user.id);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
    });

    res.send(imageBuffer);
  }
}
