import { Exclude } from 'class-transformer';
import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ schema: 'inplanner', name: 'user_roles' })
export class UserRoleEntity {
  @PrimaryColumn()
  user_id: number;

  @PrimaryColumn({ type: 'bigint' })
  rol_id: number;

  @Exclude()
  @ManyToOne(() => UserEntity, (user) => user.userRoles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
