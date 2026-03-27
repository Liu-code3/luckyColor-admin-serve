import { Module } from '@nestjs/common';
import { WatermarkController } from './watermark.controller';
import { WatermarkService } from './watermark.service';

@Module({
  controllers: [WatermarkController],
  providers: [WatermarkService]
})
export class WatermarkModule {}
