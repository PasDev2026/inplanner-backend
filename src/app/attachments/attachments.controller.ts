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
import {
  GetObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { AttachmentsService } from './attachments.service';
import { QueryAttachmentDto } from './dtos/query-attachment.dto';
import { AttachmentResponseDto } from './dtos/response/attachment-response.dto';
import { s3, S3_BUCKET } from '../uploads/s3.client';

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
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${file.fileName}"`,
      );
    }
    await this.streamFile(res, file.key, file.mimeType);
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
    await this.streamFile(res, file.key, file.mimeType);
  }

  private async resolveSigned(
    id: string,
    sig: string,
    previewIndex: number | undefined,
  ): Promise<{ key: string; mimeType: string; fileName: string }> {
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

  private async streamFile(
    res: Response,
    key: string,
    mimeType: string,
  ): Promise<void> {
    let result: GetObjectCommandOutput;
    try {
      result = await s3.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      );
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', String(result.ContentLength ?? ''));
    if (result.Body instanceof Readable) {
      result.Body.pipe(res);
    } else {
      res.end();
    }
  }
}
