const config = require('../../../config');

const STATUTS = {
  online: 'En ligne',
  idle: 'Inactif',
  dnd: 'Ne pas déranger',
  invisible: 'Invisible'
};

module.exports = {
  name: 'status',
  description: 'Change le status du bot',

  async execute(client, message, args) {
    if (message.author.id !== config.ownerId) {
      return message.reply('Vous n’êtes pas autorisé à utiliser cette commande.');
    }

    const choix = (args[0] || '').toLowerCase();

    if (!STATUTS[choix]) {
      return message.reply(
        'Utilisation : `+status online`, `+status idle`, `+status dnd` ou `+status invisible`'
      );
    }

    client.presenceStatus = choix;
    client.user.setStatus(choix);

    return message.reply(`Statut du bot : **${STATUTS[choix]}**`);
  }
};
