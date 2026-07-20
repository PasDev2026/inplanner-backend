import { Expose } from 'class-transformer';
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AreaEntity } from '../../areas/entities/area.entity';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ type: 'uuid' })
  id_user: string;

  @Column({ type: 'uuid', unique: true })
  persona_uuid: string;

  @Column({ length: 20, unique: true })
  numero_documento: string;

  @Expose({ groups: ['user-detail'] })
  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido_paterno: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido_materno: string;

  @Expose({ groups: ['user-detail'] })
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Expose({ groups: ['user-detail'] })
  @Column({ type: 'uuid', nullable: true })
  sede_id: string | null;

  @Expose({ groups: ['user-detail'] })
  @Column({ default: true })
  estado: boolean;

  @Expose({ groups: ['user-detail'] })
  @CreateDateColumn()
  created_at: Date;

  @Expose({ groups: ['user-detail'] })
  @UpdateDateColumn()
  updated_at: Date;

  @Expose({ groups: ['user-detail'] })
  @ManyToOne(() => AreaEntity)
  @JoinColumn({ name: 'area_id' })
  area: AreaEntity;
}
