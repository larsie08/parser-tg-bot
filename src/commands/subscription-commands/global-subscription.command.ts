import { Markup, Telegraf } from "telegraf";
import {
  cancelOperationMessage,
  getKeySubscriptionFromKeyboardCallback,
  notifyUserAboutError,
  sendAndDeleteWithTimeout,
  sendAndTrackMessage,
} from "../../utils";
import { UserNewsSubscriptionService } from "../../services";

import { Command, IBotContext, NewsSubscriptionsSettings } from "../../context";
import { UserNewsSubscription } from "../../entities";

export class GlobalSubscriptionCommand extends Command {
  constructor(
    bot: Telegraf<IBotContext>,
    private userNewsSubscriptionService: UserNewsSubscriptionService,
  ) {
    super(bot);
  }

  handle(): void {
    this.bot.action(
      "global_subscription_start",
      async (context: IBotContext) => {
        const userId = context.from?.id;

        if (!userId)
          return notifyUserAboutError(
            context,
            "Произошла ошибка с определением пользователя.",
          );

        const userSubscriptions =
          await this.userNewsSubscriptionService.getUserSubscriptions(userId);

        if (userSubscriptions)
          this.setSubscriptionsSessionState(context, userSubscriptions);

        await sendAndTrackMessage(
          context,
          "Выберите новости, которые будете получать.",
          "userSubscriptionsMessageId",
          this.buildSubscriptionKeyboard(context),
        );
      },
    );

    this.bot.action(
      /^global_subscription_toggle_(.+)$/,
      async (context: IBotContext) => {
        const key = getKeySubscriptionFromKeyboardCallback(
          context,
        ) as keyof NewsSubscriptionsSettings;

        if (!key)
          return notifyUserAboutError(
            context,
            "Произошла ошибка при получении id кнопки",
          );

        context.session.subscriptionDraft[key] =
          !context.session.subscriptionDraft[key];

        await context.editMessageReplyMarkup(
          this.buildSubscriptionKeyboard(context).reply_markup,
        );
      },
    );

    this.bot.action(
      "global_subscription_save",
      async (context: IBotContext) => {
        const userId = context.from?.id;

        if (!userId)
          return notifyUserAboutError(
            context,
            "Произошла ошибка с опеределение id пользователя",
          );

        await this.userNewsSubscriptionService.saveUserSubscriptions(
          userId,
          context.session.subscriptionDraft,
        );

        await context.deleteMessages(
          context.session.messagesId.userSubscriptionsMessageId,
        );

        await sendAndDeleteWithTimeout(context, "Успешно сохранено.");
      },
    );

    this.bot.action(
      "global_subscription_cancel",
      async (context: IBotContext) => {
        await cancelOperationMessage(
          context,
          "userSubscriptionsMessageId",
          null,
        );
      },
    );
  }

  private setSubscriptionsSessionState(
    context: IBotContext,
    userSubscriptions: UserNewsSubscription,
  ): void {
    Object.assign(context.session.subscriptionDraft, userSubscriptions);
  }

  private buildSubscriptionKeyboard(context: IBotContext) {
    const state = context.session.subscriptionDraft;
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          `${state.patches ? "✅" : "❌"} Патчи и обновления`,
          "global_subscription_toggle_patches",
        ),
      ],
      [
        Markup.button.callback(
          `${state.devDiary ? "✅" : "❌"} Дневники`,
          "global_subscription_toggle_devDiary",
        ),
      ],
      [
        Markup.button.callback(
          `${state.discounts ? "✅" : "❌"} Скидки`,
          "global_subscription_toggle_discounts",
        ),
      ],
      [
        Markup.button.callback(
          `${state.announcements ? "✅" : "❌"} Анонсы`,
          "global_subscription_toggle_announcements",
        ),
      ],
      [
        Markup.button.callback("💾 Сохранить", "global_subscription_save"),
        Markup.button.callback("❌ Отмена", "global_subscription_cancel"),
      ],
    ]);
  }
}
