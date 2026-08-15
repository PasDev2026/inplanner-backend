import { Injectable, Inject } from '@nestjs/common';
import type { IAttachmentRepository } from '../repository/attachment-repository.interface';
import { ATTACHMENT_REPOSITORY } from '../repository/attachment-repository.interface';
import { AttachmentEntity } from '../entities/attachment.entity';

@Injectable()
export class FindAttachmentsByTaskUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepo: IAttachmentRepository,
  ) {}

  async execute(taskId: number): Promise<AttachmentEntity[]> {
    return this.attachmentRepo.findByTask(taskId);
  }
}
