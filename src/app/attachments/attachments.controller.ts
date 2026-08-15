import {
  Controller,
  Get,
  Query,
  Param,
  ParseUUIDPipe,
  ParseIntPipe,
  Res,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { AttachmentsService } from './attachments.service';
import { QueryAttachmentDto } from './dtos/query-attachment.dto';
import { AttachmentResponseDto } from './dtos/response/attachment-response.dto';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get()
  findByTask(
    @Query() query: QueryAttachmentDto,
  ): Promise<AttachmentResponseDto[]> {
    if (!query.task_id) {
      throw new NotFoundException('task_id es requerido');
    }
    return this.attachmentsService.findByTask(query.task_id);
  }

  @Get(':id')
  @Public()
  @SkipTransform()
  async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('sig') sig: string,
    @Query('dl') dl: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.resolveSigned(id, sig, undefined);
    if (dl) {
      res.download(file.absolutePath, path.basename(file.fileName));
      return;
    }
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(file.absolutePath);
  }

  @Get(':id/preview/:index')
  @Public()
  @SkipTransform()
  async downloadPreview(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('index', new ParseIntPipe()) index: number,
    @Query('sig') sig: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.resolveSigned(id, sig, index);
    res.setHeader('Content-Type', file.mimeType);
    res.sendFile(file.absolutePath);
  }

  private async resolveSigned(
    id: string,
    sig: string,
    previewIndex: number | undefined,
  ): Promise<{ absolutePath: string; mimeType: string; fileName: string }> {
    const path =
      `/attachments/${id}` +
      (previewIndex === undefined ? '' : `/preview/${previewIndex}`);
    if (!this.attachmentsService.validate(path, sig)) {
      throw new ForbiddenException('Firma invalida');
    }
    const attachment = await this.attachmentsService.findById(id);
    const file = this.attachmentsService.resolveFile(attachment, previewIndex);
    if (!file) {
      throw new NotFoundException('Preview no encontrado');
    }
    return file;
  }
}
