import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Game } from "./game.entity";

@Entity()
@Unique(["user", "game"])
export class GameNewsSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.gameSubscriptions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Game, (game) => game.subscriptions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "game_id" })
  game!: Game;

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
