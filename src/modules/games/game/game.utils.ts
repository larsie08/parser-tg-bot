import { Markup } from "telegraf";
import { InlineKeyboardMarkup } from "telegraf/types";

import { buildPaginationButtons, formatCurrency } from "../../../shared";

import { CommandActionName } from "../../../bot";
import { Game, GameMeta, IGameSteamData, PriceHistory } from "../..";

const GAMES_PER_PAGE = 5;

export function createGameMessage(
  gameData: IGameSteamData | GameMeta,
  game: Game,
  diff: Partial<IGameSteamData>,
  formatedReleaseDate?: string,
  lowestPriceInHistory: PriceHistory | null = null,
  isGameNowReleased = false,
): string {
  const messageParts: string[] = [`🎮 *Название:* ${game.name}`];

  const changedFields = Object.keys(diff ?? {}) as (keyof IGameSteamData)[];

  const hasPriceChanges =
    changedFields.includes("price") ||
    changedFields.includes("oldPrice") ||
    changedFields.includes("discount");

  const hasReleaseChanges = changedFields.includes("releaseDate");

  const currency = formatCurrency(gameData.currency!);

  const shouldSendLowestPriceFromCommand =
    lowestPriceInHistory && lowestPriceInHistory.price !== gameData.price
      ? true
      : false;

  if (isGameNowReleased) {
    messageParts.push("🎉 *Игра уже вышла!*\n");
  }

  if (hasPriceChanges) {
    if (lowestPriceInHistory) {
      messageParts.push(
        `🏆 *Новый исторический минимум:* ${gameData.price} ${currency}`,
        `📉 *Предыдущий минимум:* ${lowestPriceInHistory.price} ${currency}`,
      );
    }
    if (gameData.oldPrice) {
      messageParts.push(`💸 *Старая цена:* ${gameData.oldPrice} ${currency}`);
    }

    if (gameData.price) {
      messageParts.push(`💰 *Новая цена:* ${gameData.price} ${currency}`);
    }

    if (gameData.discount && gameData.discount !== "0") {
      messageParts.push(`🔥 *Скидка:* ${gameData.discount}%`);
    }
  }

  if (hasReleaseChanges && !isGameNowReleased) {
    messageParts.push("📅 *Изменение даты выхода!*\n");

    if (gameData.releaseDate) {
      messageParts.push(
        `📅 *Дата выхода:* ${formatedReleaseDate ?? gameData.releaseDate}`,
      );
    }
  }

  if (!hasPriceChanges && !hasReleaseChanges && !isGameNowReleased) {
    if (gameData.comingSoon) {
      if (gameData.releaseDate) {
        messageParts.push(
          `📅 *Дата выхода:* ${formatedReleaseDate ?? gameData.releaseDate}`,
        );
      }
    } else {
      if (gameData.oldPrice) {
        messageParts.push(`💸 *Старая цена:* ${gameData.oldPrice} ${currency}`);
      }

      if (gameData.price) {
        messageParts.push(`💰 *Цена:* ${gameData.price} ${currency}`);
      }

      if (gameData.discount && gameData.discount !== "0") {
        messageParts.push(`🔥 *Скидка:* ${gameData.discount}%`);
      }

      if (shouldSendLowestPriceFromCommand) {
        messageParts.push(
          `*Самая низкая зафиксированная цена:* ${lowestPriceInHistory!.price} ${currency}`,
        );
      }
    }
  }

  if (game.href) {
    messageParts.push(`🔗 [Ссылка](${game.href})`);
  }

  return messageParts.join("\n");
}

export function handleFormatUrlSearch(game: string): string {
  return encodeURIComponent(game);
}

export function parseGameNamesFromMessage(text: string): string[] {
  if (!text?.trim()) return [];

  return text
    .split(";")
    .map((game) => game.trim())
    .filter((game) => game.length > 0);
}

export function buildGamePaginationMarkUp(
  games: Game[],
  page: number,
  action: CommandActionName,
  deleteOption = false,
): Markup.Markup<InlineKeyboardMarkup> {
  const start = page * GAMES_PER_PAGE;
  const pageGames = games.slice(start, start + GAMES_PER_PAGE);

  const totalPages = Math.ceil(games.length / GAMES_PER_PAGE);

  const keyboard = pageGames.map((game) => [
    Markup.button.callback(
      `🎮 ${game.name}`,
      `${action}_select:${game.id}${deleteOption ? `:${page}` : ""}`,
    ),
  ]);

  const pagination = buildPaginationButtons(page, totalPages, action, false);

  return Markup.inlineKeyboard([...keyboard, ...pagination]);
}
