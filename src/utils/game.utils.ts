import { IGameSteamData } from "../context";
import { Game } from "../entities";

export function createGameMessage(
  gameData: IGameSteamData,
  game: Game,
  diff?: Partial<IGameSteamData>,
): string {
  const messageParts: string[] = [`🎮 *Название:* ${gameData.name}`];

  if (gameData.comingSoon) {
    if (gameData.releaseDate) {
      messageParts.push(`📅 *Дата выхода:* ${gameData.releaseDate}`);
    }

    if (gameData.releaseTime) {
      messageParts.push(`⏰ *Время выхода:* ${gameData.releaseTime}`);
    }
  } else if (gameData.oldPrice && gameData.discount) {
    messageParts.push(
      `💸 *Старая цена:* ${gameData.oldPrice}`,
      `💰 *Новая цена:* ${gameData.price}`,
      `🔥 *Скидка:* ${gameData.discount}`,
    );
  } else if (gameData.price) {
    messageParts.push(`💰 *Цена:* ${gameData.price}`);
  }

  if (game.href) {
    messageParts.push(`🔗 [Ссылка](${game.href})`);
  }

  const changedFields = Object.keys(diff ?? {});

  const hasPriceChanges =
    changedFields.includes("price") ||
    changedFields.includes("oldPrice") ||
    changedFields.includes("discount");

  const hasReleaseChanges =
    changedFields.includes("releaseDate") ||
    changedFields.includes("releaseTime");

  let prefix = "";

  if (hasPriceChanges) {
    prefix = "🔔 *Изменение цены!*\n\n";
  } else if (hasReleaseChanges) {
    prefix = "📅 *Изменение даты выхода!*\n\n";
  }

  return prefix + messageParts.join("\n");
}

export function handleFormatUrlSearch(game: string): string {
  return encodeURIComponent(game);
}
