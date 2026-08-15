import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AttachmentEntity } from '../entities/attachment.entity';
import type { IAttachmentRepository } from '../repository/attachment-repository.interface';

@Injectable()
export class AttachmentTypeormRepository implements IAttachmentRepository {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly repo: Repository<AttachmentEntity>,
  ) {}

  async save(attachment: AttachmentEntity): Promise<AttachmentEntity> {
    return this.repo.save(attachment);
  }

  async findByTask(taskId: number): Promise<AttachmentEntity[]> {
    return this.repo.find({
      where: { task_id: taskId },
      order: { created_at: 'DESC' },
    });
  }

  async findById(id: string): Promise<AttachmentEntity | null> {
    return this.repo.findOne({ where: { id_attachment: id } });
  }

  async findByIds(ids: string[]): Promise<AttachmentEntity[]> {
    return this.repo.find({ where: { id_attachment: In(ids) } });
  }

  async remove(attachment: AttachmentEntity): Promise<void> {
    await this.repo.remove(attachment);
  }
}
