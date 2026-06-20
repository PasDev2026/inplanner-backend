import { Exclude, Expose } from 'class-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AreaEntity } from '../areas/area.entity';
import { UserSedeEntity } from './user-sede.entity';
import { UserRoleEntity } from './user-role.entity';

@Entity({ schema: 'inplanner', name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id_user: number;

  @Column({ length: 100, unique: true })
  username: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Expose({ groups: ['user-detail'] })
  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido_paterno: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  apellido_materno: string;

  @Expose({ groups: ['user-detail'] })
  @Column({ length: 20, unique: true })
  dni: string;

  @Expose({ groups: ['user-detail'] })
  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

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

  @Expose({ groups: ['user-detail'] })
  @OneToMany(() => UserSedeEntity, (us) => us.user)
  userSedes: UserSedeEntity[];

  @Expose({ groups: ['user-detail'] })
  @OneToMany(() => UserRoleEntity, (ur) => ur.user)
  userRoles: UserRoleEntity[];
}
