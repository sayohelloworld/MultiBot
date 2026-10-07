const config = require("../../../config.js");

module.exports = {
    name: "quitguild",
    description: "Force le bot à quitter un serveur",
    usage: "+quitguild <guildID>",

    async execute(client, message, args) {

        if (message.author.id !== config.ownerId) {
            return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
        }

        if (!args[0]) {
            return message.reply("Donne l'ID du serveur.");
        }

        const guildId = args[0];

        try {
            const guild = await client.guilds.fetch(guildId);

            if (!guild) {
                return message.reply("Serveur introuvable.");
            }

            await guild.leave();

            return message.reply(`J'ai quitté le serveur : ${guild.name}`);
        } catch (err) {
            console.error(err);
            return message.reply("Erreur lors de la tentative de quitter le serveur.");
        }
    }
};
