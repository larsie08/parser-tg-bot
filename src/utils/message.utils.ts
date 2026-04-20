import { IBotContext } from "../context";

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
