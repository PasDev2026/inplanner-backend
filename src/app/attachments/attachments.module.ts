import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentEntity } from './entities/attachment.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { SignatureService } from './signature.service';
import { CreateAttachmentUseCase } from './use-cases/create-attachment.use-case';
import { FindAttachmentsByTaskUseCase } from './use-cases/find-attachments-by-task.use-case';
import { FindAttachmentUseCase } from './use-cases/find-attachment.use-case';
import { DeleteAttachmentUseCase } from './use-cases/delete-attachment.use-case';
import { ATTACHMENT_REPOSITORY } from './repository/attachment-repository.interface';
import { AttachmentTypeormRepository } from './persistence/attachment.typeorm.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AttachmentEntity])],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsService,
    SignatureService,
    CreateAttachmentUseCase,
    FindAttachmentsByTaskUseCase,
    FindAttachmentUseCase,
    DeleteAttachmentUseCase,
    {
      provide: ATTACHMENT_REPOSITORY,
      useClass: AttachmentTypeormRepository,
    },
  ],
  exports: [AttachmentsService, SignatureService, TypeOrmModule],
})
export class AttachmentsModule {}
