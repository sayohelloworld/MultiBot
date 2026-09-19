const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'set-money',
  description: 'Configure les récompenses daily, weekly et monthly du serveur.',

  async execute(client, message, args) {
    if (!message.guild) {
      return message.reply('❌ Cette commande doit être utilisée sur un serveur.');
    }

    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ Cette commande est réservée aux administrateurs.');
    }

    await message.channel.sendTyping();

    const type = args[0]?.toLowerCase();
    const min = Number(args[1]);
    const max = Number(args[2]);

    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return message.reply(
        '❌ Type invalide. Utilisez `daily`, `weekly` ou `monthly`.'
      );
    }

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      min < 0 ||
      max < min
    ) {
      return message.reply(
        '❌ Utilisation : `+set-money daily 100 2000`'
      );
    }

   
    economy.setRewardConfig(message.guild.id, type, min, max);

    const container = new ContainerBuilder()
      .setAccentColor(0x57F287);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent('## 💰 Récompense économique modifiée')
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(1)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Type :** ${type}\n` +
        `**Minimum :** ${min.toLocaleString()} coins\n` +
        `**Maximum :** ${max.toLocaleString()} coins\n\n` +
        `Chaque récompense ${type} sur ce serveur sera maintenant comprise dans cette plage.`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};
