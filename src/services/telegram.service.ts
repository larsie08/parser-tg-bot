import { Markup, Telegraf } from "telegraf";

import { IBotContext, MessagesIdKey } from "../context";
import { InlineKeyboardMarkup } from "telegraf/types";

export class TelegramService {
  constructor(private readonly bot: Telegraf<IBotContext>) {}

  async notifyUserAboutError(
    context: IBotContext,
    text: string,
    delay?: number,
  ): Promise<void> {
    const message = await context.sendMessage(text);

    this.timeoutDeleteMessage(context, message.message_id, delay);
  }

  async sendAndTrackMessage(
    context: IBotContext,
    text: string,
    messageArrayId: MessagesIdKey,
    markUp?: Markup.Markup<InlineKeyboardMarkup>,
  ): Promise<void> {
    const message = await context.sendMessage(text, markUp);

    context.session.messagesId[messageArrayId].push(message.message_id);
  }

  async sendAndDeleteWithTimeout(
    context: IBotContext,
    text: string,
    delay?: number,
  ) {
    const message = await context.sendMessage(text);

    this.timeoutDeleteMessage(context, message.message_id, delay);
  }

  async sendAutoMessageToUser(userId: number, message: string) {
    await this.bot.telegram.sendMessage(userId, message);
  }

  async cancelOperationMessage(
    context: IBotContext,
    messageArrayId: MessagesIdKey,
    stateType: string | null,
    messageText: string = "Отмена операции.",
  ): Promise<void> {
    await context.deleteMessages(context.session.messagesId[messageArrayId]);

    context.session.messagesId[messageArrayId] = [];
    context.session.state = stateType;

    const message = await context.sendMessage(messageText);

    this.timeoutDeleteMessage(context, message.message_id);
  }

  async deleteMessagesForCommand(
    context: IBotContext,
    messageArrayId: MessagesIdKey,
  ): Promise<void> {
    await context.deleteMessages(context.session.messagesId[messageArrayId]);
  }

  private timeoutDeleteMessage(
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
}
