import {
  AttachmentEntity,
  AttachmentPreview,
} from '../../entities/attachment.entity';

export class AttachmentResponseDto {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  date: Date;
  previews: (AttachmentPreview & { url: string })[];

  static fromEntity(
    entity: AttachmentEntity,
    sign: (path: string) => string,
  ): AttachmentResponseDto {
    const dto = new AttachmentResponseDto();
    dto.id = entity.id_attachment;
    dto.url = sign(`/attachments/${entity.id_attachment}`);
    dto.fileName = entity.file_name;
    dto.mimeType = entity.mime_type;
    dto.bytes = entity.bytes;
    dto.date = entity.created_at;
    dto.previews = (entity.previews ?? []).map((preview, index) => ({
      ...preview,
      url: sign(`/attachments/${entity.id_attachment}/preview/${index}`),
    }));
    return dto;
  }

  static fromEntityList(
    entities: AttachmentEntity[],
    sign: (path: string) => string,
  ): AttachmentResponseDto[] {
    return entities.map((e) => AttachmentResponseDto.fromEntity(e, sign));
  }
}
