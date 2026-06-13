import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../users/user.entity';

@Entity({ schema: 'inplanner', name: 'project_responsibles' })
export class ProjectResponsibleEntity {
  @PrimaryColumn()
  project_id: number;

  @PrimaryColumn()
  user_id: number;

  @ManyToOne(() => ProjectEntity, p => p.responsibles)
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
