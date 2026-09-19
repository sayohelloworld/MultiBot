const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'leaderboard',
  description: 'Affiche le classement des membres les plus riches.',

  async execute(client, message, args) {
    if (!message.guild) {
      return message.reply('❌ Cette commande doit être utilisée sur un serveur.');
    }

    if (economy.isBlacklisted(message.guild.id, message.author.id)) {
      return message.reply('❌ Vous êtes blacklisté de l\'économie sur ce serveur.');
    }

    await message.channel.sendTyping();

    const page = parseInt(args[0]) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

   
    const allData = economy.loadData();
    const prefix = `${message.guild.id}_`;

    const leaderboard = Object.entries(allData)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, userData]) => {
        const userId = key.replace(prefix, '');
        const total = (userData.cash || 0) + (userData.bank || 0);
        return { id: userId, total, ...userData };
      })
      .sort((a, b) => b.total - a.total);

    if (!leaderboard.length) {
      const container = new ContainerBuilder()
        .setAccentColor(0xff0000);

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `## 🏆 Leaderboard`
        )
      );

      container.addSeparatorComponents(
        new SeparatorBuilder().setDivider(true)
      );

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Aucun utilisateur enregistré sur ce serveur.`
        )
      );

      return message.channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
      });
    }

    const totalPages = Math.ceil(leaderboard.length / perPage) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const pageOffset = (currentPage - 1) * perPage;
    const pageData = leaderboard.slice(pageOffset, pageOffset + perPage);

    const container = new ContainerBuilder()
      .setAccentColor(0xffd700);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🏆 Leaderboard — ${message.guild.name}`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    const text = pageData.map((entry, i) => {
      const rank = pageOffset + i + 1;
      const medal =
        rank === 1 ? '🥇' :
        rank === 2 ? '🥈' :
        rank === 3 ? '🥉' : '🏅';

      const user = message.guild.members.cache.get(entry.id);

      return `${medal} **#${rank} ${user?.user.username || 'Utilisateur inconnu'}**\n` +
             `💰 ${entry.total.toLocaleString()} coins\n`;
    }).join('\n');

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(text)
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `📄 Page **${currentPage}/${totalPages}** • 👥 ${leaderboard.length} joueurs`
      )
    );

    const userRank = leaderboard.findIndex(e => e.id === message.author.id) + 1;

    if (userRank > 0) {
      const userEntry = leaderboard[userRank - 1];

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `📊 Votre position : **#${userRank}** — ${userEntry.total.toLocaleString()} coins`
        )
      );
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`lb_prev_${currentPage}`)
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1),

      new ButtonBuilder()
        .setCustomId(`lb_refresh_${currentPage}`)
        .setLabel('🔄')
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`lb_next_${currentPage}`)
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages)
    );

    container.addActionRowComponents(row);

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
