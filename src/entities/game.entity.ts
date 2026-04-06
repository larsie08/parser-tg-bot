import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "./user.entity";
import { News } from "./news.entity";
import { GameMeta } from "./gameMeta.entity";

@Entity()
export class Game {
  @PrimaryGeneratedColumn({ name: "game_id" })
  id!: number;

  @Column()
  name!: string;

  @Column()
  steamId!: string;

  @ManyToOne(() => User, (user) => user.games)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @OneToMany(() => News, (news) => news.game)
  news!: News[];

  @OneToOne(() => GameMeta, (meta) => meta.game)
  meta?: GameMeta;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
