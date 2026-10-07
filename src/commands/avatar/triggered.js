module.exports = {
  name: 'triggered',

  async execute(client, message, args) {
    return message.reply("Commande temporairement indisponible : dépendance GIF non installée.");
  }
};