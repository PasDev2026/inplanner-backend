import { Injectable, Inject } from '@nestjs/common';
import * as fs from 'fs';
import type { IAttachmentRepository } from '../repository/attachment-repository.interface';
import { ATTACHMENT_REPOSITORY } from '../repository/attachment-repository.interface';
import { AttachmentEntity } from '../entities/attachment.entity';
import { previewFileName } from '../attachment-files.util';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepo: IAttachmentRepository,
  ) {}

  async execute(attachment: AttachmentEntity): Promise<void> {
    const paths = [attachment.file_path];
    for (const preview of attachment.previews ?? []) {
      paths.push(previewFileName(attachment.file_path, preview.width));
    }
    for (const filePath of paths) {
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }
    await this.attachmentRepo.remove(attachment);
  }

  async executeMany(attachments: AttachmentEntity[]): Promise<void> {
    for (const attachment of attachments) {
      await this.execute(attachment);
    }
  }
}
