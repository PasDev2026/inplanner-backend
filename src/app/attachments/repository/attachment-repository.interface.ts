import { InjectionToken } from '@nestjs/common';
import { AttachmentEntity } from '../entities/attachment.entity';

export const ATTACHMENT_REPOSITORY = 'ATTACHMENT_REPOSITORY' as InjectionToken;

export interface IAttachmentRepository {
  save(attachment: AttachmentEntity): Promise<AttachmentEntity>;
  findByTask(taskId: number): Promise<AttachmentEntity[]>;
  findById(id: string): Promise<AttachmentEntity | null>;
  findByIds(ids: string[]): Promise<AttachmentEntity[]>;
  remove(attachment: AttachmentEntity): Promise<void>;
}
