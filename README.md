# 🤖 **Discover MultiBot — The all-in-one Discord bot for your server!**

> MultiBot brings **everything your server needs** into one powerful bot: moderation, utilities, management, automation, entertainment, and much more. With **300+ commands**, MultiBot provides a complete, free, and regularly updated solution for Discord servers.

## 🐱 **MultiBot**

**100% Free**

> ✅ **300+ multifunctional commands**
> ✅ Moderation, utilities, management, fun & much more
> ✅ **Regular updates & maintenance**
> ✅ **Dedicated support**
> ⚠️ ~~Bot customization~~

## ⚡ **Features**

MultiBot includes a wide range of systems designed to simplify server management and improve the experience of your community.

* 🛡️ Moderation & AutoMod
* ⚙️ Server configuration
* 🎫 Ticket system
* 🎉 Giveaway system
* 🎂 Birthday system
* 🔊 Voice channel management
* 💰 Economy system
* ⭐ Leveling & points
* 🎵 Music
* 🎮 Games & fun commands
* 📊 Utilities & information
* 🤖 Automation
* 🔐 Security features
* 🧰 Backup & server management
* 👤 Avatar & profile tools
* And much more

## 📦 **Installation**

### Requirements

* [Node.js](https://nodejs.org/) **v18 or newer**
* A Discord application and bot
* A Discord server where you have permission to add the bot

### Clone the repository

```bash
git clone https://github.com/sayohelloworld/MultiBot.git
cd MultiBot
```

### Install dependencies

```bash
npm install
```

## ⚙️ **Configuration**

Before starting the bot, create or edit the `config.js` file.

Example:

```js
module.exports = {
  token: "VOTRE_TOKEN_DISCORD",
  prefix: "+",
  clientId: "ID_DU_BOT",
  embedColor: "#49ff02",
  ownerId: "VOTRE_ID_DISCORD",
  supportServerInvite: "https://discord.gg/votre-serveur",
  clientId: "ID_DU_BOT"
};
```

Replace the values with your own Discord bot credentials.

> ⚠️ **Never publish your bot token or any other private credentials on GitHub.**
>
> If you use a public repository, make sure `config.js` is included in `.gitignore` or use environment variables instead.

## 🚀 **Deploy**

After configuring your bot, deploy your commands with:

```bash
node deploy-commands.js
```

Then start MultiBot:

```bash
node index.js
```

If your project uses different entry points or deployment scripts, replace the filenames with the ones used by your installation.

### 🔄 **Running with PM2**

For a permanent deployment, you can use PM2:

```bash
npm install -g pm2
pm2 start index.js --name MultiBot
pm2 save
```

To restart the bot:

```bash
pm2 restart MultiBot
```

To view the logs:

```bash
pm2 logs MultiBot
```

## 🤝 **Contributing**

Contributions, suggestions and improvements are welcome.

If you find a bug or have an idea for a new feature, feel free to open an **Issue** or submit a **Pull Request**.

## 📄 **License**

MultiBot is distributed under the **MIT License**.

You are free to use, modify, distribute and build upon the project in accordance with the terms of the MIT License.

See the [`LICENSE`](LICENSE) file for the complete license text.

---

## ❤️ **Made with heart**

> MultiBot is developed with **passion, dedication and a lot of heart**.
>
> Built to learn, improve, experiment and create a complete Discord bot from the ground up.
>
> **Made with ❤️ for Discord communities.**
