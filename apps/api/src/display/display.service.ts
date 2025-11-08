import { Injectable } from '@nestjs/common';
import { createCanvas, Canvas, CanvasRenderingContext2D } from 'canvas';
import { DISPLAY } from '@vitrine/shared';

@Injectable()
export class DisplayService {
  private readonly width = DISPLAY.WIDTH;
  private readonly height = DISPLAY.HEIGHT;

  async generateImage(userId: string): Promise<Buffer> {
    // Create canvas
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');

    // Set background to white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw a simple layout (placeholder for now)
    this.drawLayout(ctx);

    // TODO: Fetch user's widget configs and render each widget
    // For now, we'll draw placeholder content
    this.drawPlaceholderContent(ctx);

    // Convert to PNG buffer
    return canvas.toBuffer('image/png');
  }

  private drawLayout(ctx: CanvasRenderingContext2D): void {
    // Draw border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, this.width - 20, this.height - 20);

    // Draw header area
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 10, this.width - 20, 60);

    // Draw header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('E-Ink Dashboard', this.width / 2, 40);
  }

  private drawPlaceholderContent(ctx: CanvasRenderingContext2D): void {
    const startY = 90;
    const padding = 20;

    // Time/Date widget placeholder
    this.drawWidgetBox(ctx, padding, startY, 360, 150, 'Time & Date');
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      200,
      startY + 60,
    );
    ctx.font = '24px sans-serif';
    ctx.fillText(
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      200,
      startY + 110,
    );

    // Weather widget placeholder
    this.drawWidgetBox(ctx, 400, startY, 380, 150, 'Weather');
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Configure your API key', 420, startY + 70);
    ctx.fillText('to see weather data', 420, startY + 100);

    // Calendar widget placeholder
    this.drawWidgetBox(ctx, padding, startY + 170, 360, 200, 'Calendar');
    ctx.font = '20px sans-serif';
    ctx.fillText('Configure your Google', 40, startY + 220);
    ctx.fillText('Calendar API to see events', 40, startY + 250);

    // News/RSS widget placeholder
    this.drawWidgetBox(ctx, 400, startY + 170, 380, 200, 'News');
    ctx.fillText('Configure RSS feed', 420, startY + 220);
    ctx.fillText('to see latest news', 420, startY + 250);
  }

  private drawWidgetBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
  ): void {
    // Draw widget border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Draw title background
    ctx.fillStyle = '#EEEEEE';
    ctx.fillRect(x, y, width, 30);

    // Draw title text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + 10, y + 15);
  }
}
