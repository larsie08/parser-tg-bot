import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Game, GameMetaType, User } from "../..";

@Entity()
export class Giveaway {
  @PrimaryGeneratedColumn({ name: "giveaway_id" })
  id!: number;

  @Column({
    type: "enum",
    enum: GameMetaType,
    enumName: "game_meta_type",
  })
  type!: GameMetaType;

  @Column()
  name!: string;

  @Column()
  steamId!: string;

  @Column()
  href!: string;

  @Column()
  isStillBeingGiveaway!: boolean;

  @OneToOne(() => Game, (game) => game.giveawayAdditionGiveaway)
  @JoinColumn({ name: "game_id" })
  gameParent?: Game;

  @OneToMany(() => User, (user) => user.giveawayNotification)
  @JoinColumn({ name: "userId" })
  alreadyNotifiedUsers!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
