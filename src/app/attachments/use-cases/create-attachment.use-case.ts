import { Injectable, Inject } from '@nestjs/common';
import type { IAttachmentRepository } from '../repository/attachment-repository.interface';
import { ATTACHMENT_REPOSITORY } from '../repository/attachment-repository.interface';
import { AttachmentEntity } from '../entities/attachment.entity';
import { CreateAttachmentDto } from '../dtos/create-attachment.dto';

@Injectable()
export class CreateAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepo: IAttachmentRepository,
  ) {}

  async execute(
    dto: CreateAttachmentDto,
    createdById: string,
  ): Promise<AttachmentEntity> {
    const attachment = new AttachmentEntity();
    Object.assign(attachment, dto, { created_by_id: createdById });
    return this.attachmentRepo.save(attachment);
  }
}
