import { Telegraf } from "telegraf";

import { IBotContext } from "./context.interface";

export abstract class Command {
  constructor(protected readonly bot: Telegraf<IBotContext>) {}

  abstract handle(): Promise<void>;
}
