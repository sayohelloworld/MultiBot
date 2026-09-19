const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder
} = require('discord.js');

const economy = require('../../utils/economy');

module.exports = {
  name: 'deposit',
  description: 'Dépose de l\'argent dans la banque.',

  async execute(client, message, args) {
    if (!message.guild) {
      return message.reply('❌ Cette commande doit être utilisée sur un serveur.');
    }

    if (economy.isBlacklisted(message.guild.id, message.author.id)) {
      return message.reply('❌ Vous êtes blacklisté de l\'économie sur ce serveur.');
    }

    await message.channel.sendTyping();

    const userData = economy.getUser(message.guild.id, message.author.id);

    let amount;
    if (args[0]?.toLowerCase() === 'all' || args[0]?.toLowerCase() === 'tout') {
      amount = userData.cash;
    } else {
      amount = parseInt(args[0]);
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return message.reply('❌ Montant invalide.');
    }

    if (userData.cash < amount) {
      return message.reply('❌ Pas assez de coins dans votre portefeuille.');
    }

   
    const newCash = userData.cash - amount;
    const newBank = userData.bank + amount;

    const newData = economy.updateUser(message.guild.id, message.author.id, {
      cash: newCash,
      bank: newBank
    });

    const container = new ContainerBuilder()
      .setAccentColor(0x00ff00);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `## 🏦 Dépôt effectué`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `💵 Déposé : **${amount.toLocaleString()} coins**\n` +
        `💰 Poche : **${newData.cash.toLocaleString()} coins**\n` +
        `🏦 Banque : **${newData.bank.toLocaleString()} coins**`
      )
    );

    container.addSeparatorComponents(
      new SeparatorBuilder().setDivider(true)
    );

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `✅ Transaction réussie`
      )
    );

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });

    console.log(`[ECONOMY] [Guild: ${message.guild.id}] ${message.author.username} a déposé ${amount} coins`);
  }
};
