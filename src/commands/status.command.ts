import { Telegraf } from "telegraf";
import axios from "axios";

import { Command } from "./command.class";

import { Order } from "./../types/status.type";
import { IBotContext } from "../context/context.interface";

export class StatusCommand extends Command {
  constructor(bot: Telegraf<IBotContext>) {
    super(bot);
  }

  handle(): void {
    this.bot.hears("Узнать статус заказа", (context) => {
      context.reply("Укажите номер заказа");
      this.bot.hears(/^#(\d+)$/, async (context) => {
        const id = Number(/\d+/.exec(context.message.text));

        context.reply("Идет запрос");
        const order = await this.fetchOrder(id);
        context.editMessageText(order.deliveryMethod);
      });
    });
  }

  async fetchOrder(id: number) {
    const { data } = await axios.get<Order>(
      `https://663a356f1ae792804bee79f1.mockapi.io/orders/${id}`
    );
    return data;
  }
}
