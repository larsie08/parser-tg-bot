import { Repository } from "typeorm";
import { Additions } from "./additions.entity";
import { GameMeta } from "../meta/gameMeta.entity";
import { buildMetaUpdate, Game, GameMetaType, IGameSteamData } from "../..";

export class AdditionsService {
  constructor(
    private readonly additionsRepository: Repository<Additions>,
    private readonly metaRepository: Repository<GameMeta>,
  ) {}

  async saveAddition(
    additionData: IGameSteamData,
    game: Game,
    steamId: string,
  ): Promise<Additions> {
    const addition = this.additionsRepository.create({
      steamId,
      name: additionData.name,
      href: `https://store.steampowered.com/app/${steamId}/`,
      game: { id: game.id },
    });

    const meta = this.metaRepository.create({
      type: GameMetaType.ADDITION,
    });

    Object.assign(meta, buildMetaUpdate(additionData, meta));

    addition.meta = meta;
    meta.addition = addition;

    return await this.additionsRepository.save(addition);
  }

  async upsertGameAdditions() {}

  async getGameAddition() {}

  async getGameAllAdditions(gameId: number): Promise<Additions[]> {
    return this.additionsRepository.find({ where: { game: { id: gameId } } });
  }

  async getGameAdditionWithComingSoon() {}
}
