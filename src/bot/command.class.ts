import { Telegraf } from "telegraf";

import { IBotContext } from "./context.interface";

export abstract class Command {
  constructor(public readonly bot: Telegraf<IBotContext>) {}

  abstract handle(): void;
}
