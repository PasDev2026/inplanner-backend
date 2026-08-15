import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [AttachmentsModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
