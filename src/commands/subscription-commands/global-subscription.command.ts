import { Telegraf } from "telegraf";

import { UserNewsSubscriptionService } from "../../services";
import {
  buildSubscriptionMarkupKeyboard,
  cancelOperationMessage,
  getKeySubscriptionFromKeyboardCallback,
  notifyUserAboutError,
  sendAndDeleteWithTimeout,
  sendAndTrackMessage,
  setSubscriptionContextStateDefault,
  setSubscriptionsSessionState,
} from "../../utils";

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
        setSubscriptionContextStateDefault(context, "global");

        const userSubscriptions =
          await this.userNewsSubscriptionService.getUserSubscriptions(
            context.session.user!.userId,
          );

        if (userSubscriptions)
          setSubscriptionsSessionState(context, "global", userSubscriptions);

        await sendAndTrackMessage(
          context,
          "Выберите категории новостей, которые будете получать.",
          "userSubscriptionsMessageId",
          buildSubscriptionMarkupKeyboard(context, "global"),
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

        context.session.subscriptionDraft.global[key] =
          !context.session.subscriptionDraft.global[key];

        await context.editMessageReplyMarkup(
          buildSubscriptionMarkupKeyboard(context, "global").reply_markup,
        );
      },
    );

    this.bot.action(
      "global_subscription_save",
      async (context: IBotContext) => {
        await this.userNewsSubscriptionService.saveUserSubscriptions(
          context.session.user!.userId,
          context.session.subscriptionDraft.global,
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
}
