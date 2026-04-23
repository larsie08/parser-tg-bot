import { IGameSteamData } from "../context";

export function createGameMessage(
  gameData: IGameSteamData,
  diff?: Partial<IGameSteamData>,
): string {
  const messageParts: string[] = [`🎮 *Название:* ${gameData.name}`];

  if ("sales" in gameData && gameData.sales) {
    messageParts.push(
      `💰 *Цена:* ${gameData.price}`,
      `📊 *Продаж:* ${gameData.sales}`,
    );
  } else if (gameData.releaseDate) {
    messageParts.push(`📅 *Дата выхода:* ${gameData.releaseDate}`);
    if (gameData.releaseTime) {
      messageParts.push(`⏰ *Время выхода:* ${gameData.releaseTime}`);
    }
  } else if (gameData.oldPrice && gameData.discount) {
    messageParts.push(
      `💸 *Старая цена:* ${gameData.oldPrice}`,
      `💰 *Новая цена:* ${gameData.price}`,
      `🔥 *Скидка:* ${gameData.discount}`,
    );
  } else {
    messageParts.push(`💰 *Цена:* ${gameData.price}`);
  }

  messageParts.push(`🔗 [Ссылка](${gameData.href})`);

  const changedFields = Object.keys(diff ?? {});

  let prefix = "";

  if (changedFields.includes("price") || changedFields.includes("oldPrice")) {
    prefix = "🔔 *Изменение цены!*\n";
  } else if (changedFields.includes("releaseDate")) {
    prefix = "📅 *Изменение даты выхода!*\n";
  } else if (changedFields.includes("releaseTime")) {
    prefix = "⏰ *Изменение времени выхода!*\n";
  }

  return prefix + messageParts.join("\n");
}

export function handleFormatUrlSearch(game: string): string {
  return encodeURIComponent(game);
}
