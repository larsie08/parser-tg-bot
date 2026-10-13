import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { GameMeta } from "../..";

@Entity()
export class PriceHistory {
  @PrimaryGeneratedColumn()
  id!: number;

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
  price!: number;

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
  currency!: string;

  @Column({ nullable: true })
  discount!: string;

  @Column({ nullable: true })
  releaseDate?: string;

  @Column({ nullable: true })
  releaseTime?: string;

  @Column()
  comingSoon!: boolean;

  @Column()
  isEarlyAccess!: boolean;

  @ManyToOne(() => GameMeta, (meta) => meta.priceHistory, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meta_id" })
  meta!: GameMeta;

  @CreateDateColumn()
  createdAt!: Date;
}
