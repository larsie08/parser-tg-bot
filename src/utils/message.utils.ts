import { IBotContext, MessagesIdKey } from "../context";

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
