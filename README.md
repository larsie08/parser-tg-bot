# 🎮 Game News and Market Tracker Bot

This bot is designed to help users track news, prices, and updates for their favorite games on Steam and other marketplaces. With automated parsing, price alerts, and news notifications, it ensures you never miss out on important updates.

---

## ✨ Features

- **Game Tracking:** Add games to your watchlist and track their prices and updates.
- **Steam News Integration:** Get the latest news for your favorite games directly from Steam.
- **Price Alerts:** Receive notifications when game prices change or new offers appear.
- **Automatic Updates:** Periodic parsing to keep users informed of the latest game-related changes.
- **User-Friendly Interface:** Easy-to-use Telegram commands with inline buttons for seamless interaction.

---

## 🛠️ Installation and Setup

### Prerequisites

- Node.js (v16+ recommended)
- TypeScript
- PostgreSQL database
- [Telegram Bot API Token](https://core.telegram.org/bots#6-botfather)

### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-repo/game-tracker-bot.git
   cd game-tracker-bot
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure the Bot**
   - Create a `.env` file in the project root with the following variables:
     ```env
     BOT_TOKEN=your-telegram-bot-token
     DB_PORT=your-database-connection-string
     DB_NAME=your-database-name
     DB_USERNAME=your-database-username
     DB_PASSWORD=your-database-password
     DB_HOST=your-database-host
     ```

4. **Set Up the Database**
   - Use the provided configuration to connect to your PostgreSQL database.
   - Run migrations to initialize the database:
     ```bash
     npm run typeorm migration:run
     ```

5. **Run the Bot**
   ```bash
   npm start
   ```

---