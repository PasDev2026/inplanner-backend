import { Injectable, Inject } from '@nestjs/common';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import type { IAttachmentRepository } from '../repository/attachment-repository.interface';
import { ATTACHMENT_REPOSITORY } from '../repository/attachment-repository.interface';
import { AttachmentEntity } from '../entities/attachment.entity';
import { previewFileName } from '../attachment-files.util';
import { s3, S3_BUCKET } from '../../uploads/s3.client';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepo: IAttachmentRepository,
  ) {}

  async execute(attachment: AttachmentEntity): Promise<void> {
    const keys = [attachment.file_path];
    for (const preview of attachment.previews ?? []) {
      keys.push(previewFileName(attachment.file_path, preview.width));
    }
    for (const key of keys) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      } catch {
        // object may already be gone; ignore
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
