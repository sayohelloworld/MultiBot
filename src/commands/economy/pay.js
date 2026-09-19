const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'pay',
  description: 'Transfert de l\'argent à un autre membre.',

  async execute(client, message, args) {
    if (!message.guild) {
      return message.reply('❌ Cette commande doit être utilisée sur un serveur.');
    }

    if (economy.isBlacklisted(message.guild.id, message.author.id)) {
      return message.reply('❌ Vous êtes blacklisté de l\'économie sur ce serveur.');
    }

    await message.channel.sendTyping();

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]) || parseInt(args[0]);

    if (!target || !amount || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Usage incorrect. Exemple : `+pay @user 100`');
    }

    if (target.id === message.author.id) {
      return message.reply('❌ Vous ne pouvez pas vous donner de l\'argent à vous-même.');
    }

    if (target.bot) {
      return message.reply('❌ Vous ne pouvez pas donner de l\'argent à un bot.');
    }

    if (economy.isBlacklisted(message.guild.id, target.id)) {
      return message.reply('❌ Le destinataire est blacklisté de l\'économie sur ce serveur.');
    }

    const senderData = economy.getUser(message.guild.id, message.author.id);

    if (senderData.cash < amount) {
      return message.reply('❌ Vous n\'avez pas assez d\'argent en poche.');
    }

   
    economy.removeBalance(message.guild.id, message.author.id, amount);
    economy.addBalance(message.guild.id, target.id, amount);

    const container = new ContainerBuilder()
      .setAccentColor(0x00ff00);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 💸 Transfert réusssi\n<@${message.author.id}> → <@${target.id}>\n💰 Montant : **${amount.toLocaleString()} coins**`
      )
    );

    return message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  }
};
