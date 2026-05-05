import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Household } from './household.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  lastName!: string;

  @Column({ name: 'cycle', type: 'varchar', length: 255, nullable: true })
  cycle!: string | null;

  @Column({ name: 'expiration_date', type: 'timestamptz', nullable: true })
  expirationDate!: Date | null;

  @Column({ name: 'subscription_type', type: 'varchar', length: 255, nullable: true })
  subscriptionType!: string | null;

  @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password', type: 'varchar', length: 255, nullable: true })
  password!: string | null;

  @OneToMany(() => Household, household => household.user)
  households!: Household[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
