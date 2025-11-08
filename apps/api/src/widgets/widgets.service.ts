import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';
import { WidgetConfig } from '@vitrine/shared';

@Injectable()
export class WidgetsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createWidgetConfigDto: CreateWidgetConfigDto,
  ): Promise<WidgetConfig> {
    const { type, enabled, position, settings } = createWidgetConfigDto;

    // Check if widget of this type already exists for user
    const existing = await this.prisma.widgetConfig.findUnique({
      where: {
        userId_type: {
          userId,
          type,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Widget of type ${type} already exists`);
    }

    const widget = await this.prisma.widgetConfig.create({
      data: {
        userId,
        type,
        enabled,
        position: position as any,
        settings: settings as any,
      },
    });

    return this.mapToWidgetConfig(widget);
  }

  async findAll(userId: string): Promise<WidgetConfig[]> {
    const widgets = await this.prisma.widgetConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return widgets.map((w) => this.mapToWidgetConfig(w));
  }

  async findOne(userId: string, id: string): Promise<WidgetConfig> {
    const widget = await this.prisma.widgetConfig.findFirst({
      where: { id, userId },
    });

    if (!widget) {
      throw new NotFoundException('Widget config not found');
    }

    return this.mapToWidgetConfig(widget);
  }

  async update(
    userId: string,
    id: string,
    updateWidgetConfigDto: UpdateWidgetConfigDto,
  ): Promise<WidgetConfig> {
    const existing = await this.prisma.widgetConfig.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Widget config not found');
    }

    const updated = await this.prisma.widgetConfig.update({
      where: { id },
      data: {
        ...updateWidgetConfigDto,
        position: updateWidgetConfigDto.position as any,
        settings: updateWidgetConfigDto.settings as any,
      },
    });

    return this.mapToWidgetConfig(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.widgetConfig.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundException('Widget config not found');
    }

    await this.prisma.widgetConfig.delete({
      where: { id },
    });
  }

  private mapToWidgetConfig(widget: any): WidgetConfig {
    return {
      ...widget,
      position: widget.position as any,
      settings: widget.settings as any,
    };
  }
}
