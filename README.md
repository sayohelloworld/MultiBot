# 🤖 MultiBot

> ✦ A modern, multifunctional Discord bot built with **Node.js** & **Discord.js v14** ♡

MultiBot brings together everything you need to **manage, secure and customize** your Discord server — all in one bot.

---

## ✨ Features

🛡️ **Moderation**

* Ban, kick, mute & warn
* Moderation logs
* Configurable permissions
* Anti-raid & anti-spam
* Captcha system

💰 **Economy**

* Wallet & bank
* Daily rewards
* User payments
* Leaderboards
* Casino & virtual games

🎵 **Music**

* YouTube & SoundCloud
* Queue system
* Playlists
* Skip, stop & playback controls
* Voice channel management

🎫 **Tickets**

* Fully configurable ticket system
* Multiple categories
* Custom emojis & descriptions
* Dedicated staff roles
* Discord category support
* Ticket logs
* Custom panels
* Discord Components V2
* Automatic button / select menu system

🔧 **Utilities**

* Bot, server & user information
* Ping & latency
* Help system
* Server management tools

---

## 🛠️ Tech Stack

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge\&logo=node.js\&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge\&logo=discord\&logoColor=white)
![npm](https://img.shields.io/badge/npm-Package_Manager-CB3837?style=for-the-badge\&logo=npm\&logoColor=white)

---

## 📦 Installation

```bash
git clone https://github.com/sayohelloworld/MultiBot.git
cd MultiBot
npm install
```

Then configure your `config.js`.

### ⚙️ Configuration

```js
module.exports = {
    token: "YOUR_DISCORD_TOKEN",
    clientId: "YOUR_CLIENT_ID",
    prefix: "+",
    embedColor: "#49ff02",
    ownerId: "YOUR_DISCORD_ID",
    supportServerInvite: "https://discord.gg/your-server"
};
```

| Option                | Description            |
| --------------------- | ---------------------- |
| `token`               | Discord bot token      |
| `clientId`            | Discord application ID |
| `prefix`              | Command prefix         |
| `embedColor`          | Default embed color    |
| `ownerId`             | Bot owner's Discord ID |
| `supportServerInvite` | Support server invite  |

> ⚠️ Never share your Discord token publicly.

---

## 🚀 Start

```bash
node index.js
```

MultiBot will connect to Discord and start loading its commands and events.

---

## 🎫 Ticket System

### Main commands

```text
+ticket panel [#channel]
+ticket addcat <name> [emoji] [description]
+ticket removecat <name>
+ticket setrole <category> @Role
+ticket removerole <category> @Role
+ticket setcategory <category> <ID>
+ticket setdesc [category] <text>
+ticket setcolor <#hex>
+ticket setlog #channel
+ticket config
```

Each ticket category can have:

* 🏷️ Custom name
* 🌸 Custom emoji
* 📝 Custom description
* 👥 Staff roles
* 📁 Dedicated Discord category

**1 category** → automatic button
**Multiple categories** → selection menu

---

## 📁 Structure

```text
├── index.js
├── config.js
├── version.js
├── data/
└── src/
    ├── assets/
    ├── commands/
    ├── slashCommands/
    ├── events/
    ├── structure/
    └── utils/
```

| Folder           | Purpose                    |
| ---------------- | -------------------------- |
| `commands/`      | Prefix commands            |
| `slashCommands/` | Slash commands             |
| `events/`        | Discord events             |
| `structure/`     | Handlers & core structures |
| `utils/`         | Utility modules            |
| `assets/`        | Bot resources              |
| `data/`          | Data & configurations      |

---

## ⌨️ Commands

Default prefix: `+`

```text
+help
+ping
+ticket
+ticket config
```

Commands may change between MultiBot versions.

---

## 🌐 Hosting

MultiBot works with most Node.js-compatible hosting providers.

* Railway
* Render
* Replit
* OVHcloud
* Hetzner
* DigitalOcean

For **24/7 uptime**, a VPS or cloud host is recommended.

---

## 🔐 Security

Never commit or publish:

```text
Discord tokens
.env files
Private credentials
API keys
Sensitive information
```

Consider adding sensitive files to `.gitignore`.

---

## 📜 License

MultiBot is released under the **MIT License**.

See [`LICENSE`](LICENSE) for more information.

---

>  **⚠️ Disclaimer:** MultiBot is provided as-is. The author is not responsible for any modifications, misuse, damages, or consequences resulting from the use, modification, or redistribution of this software.

---

<p align="center">
  Made with ♡ by <b>Sayo</b>
</p>
