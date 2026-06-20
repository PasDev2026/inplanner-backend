import { Exclude } from 'class-transformer';
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ schema: 'inplanner', name: 'user_sedes' })
export class UserSedeEntity {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn({ type: 'bigint' })
  sede_id: number;

  @Exclude()
  @ManyToOne(() => UserEntity, (user) => user.userSedes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
