import { Telegraf } from "telegraf";
import LocalSession from "telegraf-session-local";

import { IConfigService } from "./src/config/config.interface";
import { ConfigService } from "./src/config/config.service";
import { IBotContext } from "./src/context/context.interface";

import { Command, StartCommand, StatusCommand } from "./src/commands";

class Bot {
  bot: Telegraf<IBotContext>;
  commands: Command[] = [];

  constructor(private readonly ConfigService: IConfigService) {
    this.bot = new Telegraf<IBotContext>(this.ConfigService.get("TOKEN"));
    this.bot.use(new LocalSession({ database: "session.json" }).middleware());
  }

  init() {
    this.commands = [new StartCommand(this.bot), new StatusCommand(this.bot)];
    for (const command of this.commands) {
      command.handle();
    }
    this.bot.launch();
  }
}

const bot = new Bot(new ConfigService());

bot.init();
