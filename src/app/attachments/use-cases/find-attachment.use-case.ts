import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IAttachmentRepository } from '../repository/attachment-repository.interface';
import { ATTACHMENT_REPOSITORY } from '../repository/attachment-repository.interface';
import { AttachmentEntity } from '../entities/attachment.entity';

@Injectable()
export class FindAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepo: IAttachmentRepository,
  ) {}

  async execute(id: string): Promise<AttachmentEntity> {
    const attachment = await this.attachmentRepo.findById(id);
    if (!attachment) {
      throw new NotFoundException('Adjunto con ID ' + id + ' no encontrado');
    }
    return attachment;
  }

  async findAllByIds(ids: string[]): Promise<AttachmentEntity[]> {
    return this.attachmentRepo.findByIds(ids);
  }
}
