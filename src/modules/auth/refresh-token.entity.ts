import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from '../users/user.entity';

@Entity({ schema: 'inplanner', name: 'refresh_tokens' })
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  token: string;

  @Column()
  user_id: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'timestamp', nullable: true })
  expiration_date: Date;

  @Column({ default: false })
  revoked: boolean;

  @CreateDateColumn()
  created_at: Date;
}
