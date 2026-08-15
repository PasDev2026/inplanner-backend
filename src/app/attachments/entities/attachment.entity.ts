import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export interface AttachmentPreview {
  width: number;
  height: number;
  bytes: number;
}

@Entity('attachments')
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id_attachment: string;

  @Column()
  task_id: number;

  @Index()
  @Column({ type: 'uuid' })
  created_by_id: string;

  @Column({ type: 'text' })
  file_name: string;

  @Column({ type: 'text' })
  mime_type: string;

  @Column({ type: 'int' })
  bytes: number;

  @Column({ type: 'text' })
  file_path: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  previews: AttachmentPreview[];

  @CreateDateColumn()
  created_at: Date;
}
