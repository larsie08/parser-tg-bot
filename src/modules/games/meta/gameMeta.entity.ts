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
import { Additions, Game, GameMetaType, PriceHistory } from "../..";

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

  @OneToMany(() => PriceHistory, (history) => history.meta, {
    onDelete: "CASCADE",
  })
  priceHistory?: PriceHistory[];

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  price?: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  oldPrice?: number;

  @Column({ nullable: true })
  currency?: string;

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
