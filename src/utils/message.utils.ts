import {
  IBotContext,
  IGameSteamData,
  MessagesIdKey,
  PendingGame,
} from "../context";
import { Game } from "../entities";

export function timeoutDeleteMessage(
  context: IBotContext,
  messageId: number,
  delay = 30000,
): void {
  setTimeout(async () => {
    try {
      await context.deleteMessage(messageId);
    } catch (error) {
      console.error("Ошибка при удалении сообщения:", error);
    }
  }, delay);
}

export async function notifyUserAboutError(
  context: IBotContext,
  text: string,
  delay?: number,
): Promise<void> {
  const message = await context.sendMessage(text);

  timeoutDeleteMessage(context, message.message_id, delay);
}

export async function sendAndTrackMessage(
  context: IBotContext,
  text: string,
  messageArrayId: MessagesIdKey,
): Promise<void> {
  await context
    .sendMessage(text)
    .then((message) =>
      context.session.messagesId[messageArrayId].push(message.message_id),
    );
}

export async function cancelOperationMessage(
  context: IBotContext,
  messageArrayId: MessagesIdKey,
  stateType: string | null,
  messageText: string = "Отмена операции.",
): Promise<void> {
  await context.deleteMessages(context.session.messagesId[messageArrayId]);

  context.session.messagesId[messageArrayId] = [];
  context.session.state = stateType;

  const message = await context.sendMessage(messageText);

  timeoutDeleteMessage(context, message.message_id);
}

export function createGameMessage(
  gameData: IGameSteamData,
  game: Game,
  diff: Partial<IGameSteamData>,
): string {
  const messageParts: string[] = [`🎮 *Название:* ${gameData.name}`];

  const changedFields = Object.keys(diff ?? {}) as (keyof IGameSteamData)[];

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
      messageParts.push(`📅 *Дата выхода:* ${gameData.releaseDate}`);
    }

    if (gameData.releaseTime) {
      messageParts.push(`⏰ *Время выхода:* ${gameData.releaseTime}`);
    }
  }

  if (!hasPriceChanges && !hasReleaseChanges) {
    if (gameData.comingSoon) {
      if (gameData.releaseDate) {
        messageParts.push(`📅 *Дата выхода:* ${gameData.releaseDate}`);
      }

      if (gameData.releaseTime) {
        messageParts.push(`⏰ *Время выхода:* ${gameData.releaseTime}`);
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
