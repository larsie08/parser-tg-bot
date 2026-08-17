import { Markup } from "telegraf";

import { InlineKeyboardMarkup } from "telegraf/types";
import {
  CommandActionName,
  IBotContext,
  MessagesIdKey,
  PendingGame,
} from "../context";
import { Game, GameMeta, IGameSteamData, NewsItem } from "../modules";

const GAMES_PER_PAGE = 5;

export function createGameMessage(
  gameData: IGameSteamData | GameMeta,
  game: Game,
  diff: Partial<IGameSteamData>,
  formatedReleaseDate: string | undefined,
): string {
  const messageParts: string[] = [`🎮 *Название:* ${game.name}`];

  const changedFields = Object.keys(diff ?? {}) as (keyof IGameSteamData)[];

  const hasPriceChanges =
    changedFields.includes("price") ||
    changedFields.includes("oldPrice") ||
    changedFields.includes("discount");

  const hasReleaseChanges = changedFields.includes("releaseDate");

  let prefix = "";

  if (hasPriceChanges) {
    prefix = "🔔 *Изменение цены!*\n\n";

    if (gameData.oldPrice) {
      messageParts.push(`💸 *Старая цена:* ${gameData.oldPrice}`);
    }

    if (gameData.price) {
      messageParts.push(`💰 *Новая цена:* ${gameData.price}`);
    }

    if (gameData.discount && gameData.discount !== "0") {
      messageParts.push(`🔥 *Скидка:* ${gameData.discount}%`);
    }
  }

  if (hasReleaseChanges) {
    prefix = "📅 *Изменение даты выхода!*\n\n";

    if (gameData.releaseDate) {
      messageParts.push(
        `📅 *Дата выхода:* ${formatedReleaseDate ?? gameData.releaseDate}`,
      );
    }
  }

  if (!hasPriceChanges && !hasReleaseChanges) {
    if (gameData.comingSoon) {
      if (gameData.releaseDate) {
        messageParts.push(
          `📅 *Дата выхода:* ${formatedReleaseDate ?? gameData.releaseDate}`,
        );
      }
    } else {
      if (gameData.oldPrice) {
        messageParts.push(`💸 *Старая цена:* ${gameData.oldPrice}`);
      }

      if (gameData.price) {
        messageParts.push(`💰 *Цена:* ${gameData.price}`);
      }

      if (gameData.discount && gameData.discount !== "0") {
        messageParts.push(`🔥 *Скидка:* ${gameData.discount}%`);
      }
    }
  }

  if (game.href) {
    messageParts.push(`🔗 [Ссылка](${game.href})`);
  }

  return prefix + messageParts.join("\n");
}

export function createNewsMessage(
  currentNews: NewsItem,
  gameName: string,
  news?: NewsItem[],
): string {
  let message: string = `Название Игры: ${gameName}\nНовость: ${currentNews.title}\nТекст: ${currentNews.contents}\nСсылка: ${currentNews.url}`;

  if (news && !news.some((item) => item.gid === currentNews.gid)) {
    message = `Новая новость!\nНазвание Игры: ${gameName}\nНовость: ${currentNews.title}\nТекст: ${currentNews.contents}\nСсылка: ${currentNews.url}`;
  }

  return message;
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

  const navigation = [];

  if (page > 0) {
    navigation.push(
      Markup.button.callback("◀️", `${action}_toggle_page:${page - 1}`),
    );
  }

  navigation.push(
    Markup.button.callback(`${page + 1} / ${totalPages}`, "noop"),
  );

  if (page < totalPages - 1) {
    navigation.push(
      Markup.button.callback("▶️", `${action}_toggle_page:${page + 1}`),
    );
  }

  keyboard.push(navigation);

  keyboard.push([Markup.button.callback("❌ Отмена", `${action}_cancel`)]);

  return Markup.inlineKeyboard(keyboard);
}

export function trackUserMessage(
  context: IBotContext,
  messageArrayId: MessagesIdKey,
): void {
  const userMessageId = context.message?.message_id;

  if (userMessageId)
    context.session.messagesId[messageArrayId].push(context.message.message_id);
}

export function editAddMessageGames(
  games: string[],
  isAlreadyAddedGames: boolean,
  pendingGames?: PendingGame[],
): string {
  if (isAlreadyAddedGames)
    return games.length === 1
      ? `Игра уже находится в вашем списке: ${games[0]}`
      : `Игры уже есть в вашем списке: ${games.join(", ")}`;

  if (pendingGames && pendingGames?.length > 0) {
    const gameNames = pendingGames.map((game) => game.steamGameName);
    return games.length === 0
      ? `Следующие игры ожидают подтверждения: ${gameNames.join(", ")}`
      : games.length === 1
        ? `Следующие игры ожидают подтверждения: ${gameNames.join(", ")}\nИгра успешно добавлена: ${games[0]}`
        : `Следующие игры ожидают подтверждения: ${gameNames.join(", ")}\nИгры успешно добавлены: ${games.join(", ")}`;
  }

  return games.length === 0
    ? "Игра не была добавлена"
    : games.length === 1
      ? `Игра успешно добавлена: ${games[0]}`
      : `Игры успешно добавлены: ${games.join(", ")}`;
}
