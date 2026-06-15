import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
export class UserNewsSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User, (user) => user.UserNewsSubscription, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ default: true })
  patches!: boolean;

  @Column({ default: true })
  discounts!: boolean;

  @Column({ default: true })
  announcements!: boolean;

  @Column({ default: true })
  devDiary!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
