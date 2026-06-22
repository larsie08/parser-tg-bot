import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { GameMeta, GameNewsSubscription, News, User } from ".";

@Entity()
export class Game {
  @PrimaryGeneratedColumn({ name: "game_id" })
  id!: number;

  @Column()
  name!: string;

  @Column()
  steamId!: string;

  @Column()
  href!: string;

  @ManyToMany(() => User, (user) => user.games)
  users!: User[];

  @OneToOne(() => GameMeta, (meta) => meta.game, { cascade: true })
  meta!: GameMeta;

  @OneToMany(() => News, (news) => news.game)
  news!: News[];

  @OneToMany(() => GameNewsSubscription, (subscription) => subscription.game)
  subscriptions!: GameNewsSubscription[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
