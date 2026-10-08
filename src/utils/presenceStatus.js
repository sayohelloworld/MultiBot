const config = require('../../config');

function createStatusCommand({ name, status, label }) {
  return {
    name,

    async execute(client, message, args) {
      if (message.author.id !== config.ownerId) {
        return message.reply('Vous n’êtes pas autorisé à utiliser cette commande.');
      }

      try {
        client.presenceStatus = status;
        client.user.setStatus(status);

        return message.reply(`Statut du bot : **${label}**`);
      } catch (error) {
        console.error(`[STATUS] Erreur : ${error.message}`);
        return message.reply(`Impossible de modifier le statut : ${error.message}`);
      }
    }
  };
}

module.exports = createStatusCommand;