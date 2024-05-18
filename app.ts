import { Telegraf, session } from "telegraf";
import { IConfigService } from "./src/config/config.interface";
import { ConfigService } from "./src/config/config.service";

class Bot {
  bot: Telegraf;

  constructor(private readonly ConfigService: IConfigService) {
    this.bot = new Telegraf(this.ConfigService.get("TOKEN"));
    this.bot.use(session());
  }

  init() {
    this.bot.launch();
  }
}

const bot = new Bot(new ConfigService());
