import { Additions, Game, GameMeta, IGameSteamData } from "../..";

export function createAdditionMessage(
  additionData: IGameSteamData,
  addition: Additions,
  game: Game,
  diff: Partial<IGameSteamData>,
  formatedReleaseDate?: string,
): string {
  const messageParts: string[] = [
    `🎮 *Игра:* ${game.name}`,
    `📦 *Дополнение:* ${additionData.name ?? addition.name}`,
  ];

  const changedFields = Object.keys(diff ?? {}) as (keyof IGameSteamData)[];

  const hasPriceChanges =
    changedFields.includes("price") ||
    changedFields.includes("oldPrice") ||
    changedFields.includes("discount");

  const hasReleaseChanges = changedFields.includes("releaseDate");

  let prefix = "";

  if (hasPriceChanges) {
    prefix = "🔔 *Изменение цены дополнения!*\n\n";

    if (additionData.oldPrice) {
      messageParts.push(`💸 *Старая цена:* ${additionData.oldPrice}`);
    }

    if (additionData.price) {
      messageParts.push(`💰 *Новая цена:* ${additionData.price}`);
    }

    if (additionData.discount && additionData.discount !== "0") {
      messageParts.push(`🔥 *Скидка:* ${additionData.discount}%`);
    }
  }

  if (hasReleaseChanges) {
    prefix = "📅 *Изменение даты выхода дополнения!*\n\n";

    if (additionData.releaseDate) {
      messageParts.push(
        `📅 *Дата выхода:* ${formatedReleaseDate ?? additionData.releaseDate}`,
      );
    }
  }

  if (!hasPriceChanges && !hasReleaseChanges) {
    if (additionData.comingSoon) {
      if (additionData.releaseDate) {
        messageParts.push(
          `📅 *Дата выхода:* ${
            formatedReleaseDate ?? additionData.releaseDate
          }`,
        );
      }
    } else {
      if (additionData.oldPrice) {
        messageParts.push(`💸 *Старая цена:* ${additionData.oldPrice}`);
      }

      if (additionData.price) {
        messageParts.push(`💰 *Цена:* ${additionData.price}`);
      }

      if (additionData.discount && additionData.discount !== "0") {
        messageParts.push(`🔥 *Скидка:* ${additionData.discount}%`);
      }
    }
  }

  if (addition.href) {
    messageParts.push(`🔗 [Страница дополнения](${addition.href})`);
  }

  return prefix + messageParts.join("\n");
}

export function createNewAdditionMessage(
  addition: Additions,
  game: Game,
): string {
  const messageParts: string[] = [
    "🆕 *Найдено новое дополнение!*",
    "",
    `🎮 *Игра:* ${game.name}`,
    `📦 *Дополнение:* ${addition.name}`,
  ];

  if (addition.href) {
    messageParts.push(`🔗 [Страница дополнения](${addition.href})`);
  }

  return messageParts.join("\n");
}
