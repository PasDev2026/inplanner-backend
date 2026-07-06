import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'centralizado', name: 'rol' })
export class RolEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id_rol: number;

  @Column({ length: 255, unique: true })
  nom_rol: string;

  @Column({ default: true })
  estado: boolean;

  @Column({ type: 'bigint', nullable: true })
  aut_upt: number;

  @Column({ type: 'timestamp', nullable: true })
  fec_upt: Date;
}
