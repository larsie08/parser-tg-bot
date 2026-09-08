import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Game } from "../game/game.entity";
import { Additions } from "../additions/additions.entity";
import { GameMetaType } from "./gameMeta.types";

@Entity()
export class GameMeta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: "enum",
    enum: GameMetaType,
    enumName: "game_meta_type",
  })
  type!: GameMetaType;

  @OneToOne(() => Game, (game) => game.meta, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game?: Game;

  @OneToOne(() => Additions, (addition) => addition.meta, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "addition_id" })
  addition?: Additions;

  @Column({ nullable: true })
  price?: string;

  @Column({ nullable: true })
  oldPrice?: string;

  @Column({ nullable: true })
  discount?: string;

  @Column({ nullable: true })
  releaseDate?: string;

  @Column({ nullable: true })
  releaseTime?: string;

  @Column({ nullable: true })
  comingSoon?: boolean;

  @Column({ nullable: true })
  isEarlyAccess?: boolean;

  @Column({ nullable: true })
  lastSteamPageCheck?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
