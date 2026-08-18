import { Injectable } from '@nestjs/common';
import { CreateAttachmentUseCase } from './use-cases/create-attachment.use-case';
import { FindAttachmentsByTaskUseCase } from './use-cases/find-attachments-by-task.use-case';
import { FindAttachmentUseCase } from './use-cases/find-attachment.use-case';
import { DeleteAttachmentUseCase } from './use-cases/delete-attachment.use-case';
import { SignatureService } from './signature.service';
import { CreateAttachmentDto } from './dtos/create-attachment.dto';
import { AttachmentResponseDto } from './dtos/response/attachment-response.dto';
import { AttachmentEntity } from './entities/attachment.entity';
import {
  extractAttachmentIdsFromHtml,
  previewFileName,
} from './attachment-files.util';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly createUseCase: CreateAttachmentUseCase,
    private readonly findByTaskUseCase: FindAttachmentsByTaskUseCase,
    private readonly findUseCase: FindAttachmentUseCase,
    private readonly deleteUseCase: DeleteAttachmentUseCase,
    private readonly signatures: SignatureService,
  ) {}

  async create(
    dto: CreateAttachmentDto,
    createdById: string,
  ): Promise<AttachmentResponseDto> {
    const entity = await this.createUseCase.execute(dto, createdById);
    return this.toResponse(entity);
  }

  async findByTask(taskId: number): Promise<AttachmentResponseDto[]> {
    const entities = await this.findByTaskUseCase.execute(taskId);
    return entities.map((e) => this.toResponse(e));
  }

  async findById(id: string): Promise<AttachmentEntity> {
    return this.findUseCase.execute(id);
  }

  async removeById(id: string): Promise<void> {
    const attachment = await this.findUseCase.execute(id);
    await this.deleteUseCase.execute(attachment);
  }

  async removeReferencedInHtml(html: string): Promise<void> {
    const ids = extractAttachmentIdsFromHtml(html);
    if (ids.length === 0) {
      return;
    }
    const attachments = await this.findUseCase.findAllByIds(ids);
    await this.deleteUseCase.executeMany(attachments);
  }

  sign(path: string): string {
    return this.signatures.sign(path);
  }

  validate(path: string, signature: string | undefined): boolean {
    return this.signatures.validate(path, signature);
  }

  resolveFile(
    attachment: AttachmentEntity,
    previewIndex: number | undefined,
  ): { key: string; mimeType: string; fileName: string } | null {
    if (previewIndex === undefined) {
      return {
        key: attachment.file_path,
        mimeType: attachment.mime_type,
        fileName: attachment.file_name,
      };
    }
    const preview = attachment.previews?.[previewIndex];
    if (!preview) {
      return null;
    }
    return {
      key: previewFileName(attachment.file_path, preview.width),
      mimeType: 'image/webp',
      fileName: previewFileName(attachment.file_path, preview.width),
    };
  }

  private toResponse(entity: AttachmentEntity): AttachmentResponseDto {
    return AttachmentResponseDto.fromEntity(entity, (p) => {
      const sig = this.signatures.sign(p);
      return `${p}?sig=${sig}`;
    });
  }
}
