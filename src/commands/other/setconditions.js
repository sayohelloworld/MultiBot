const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'setconditions',
    description: 'Configure le texte des conditions de partenariat',
    async execute(client, message, args) {
        if (!message.member.permissions.has('ManageGuild')) {
            return message.reply('Vous devez avoir la permission **Gérer le serveur** pour utiliser cette commande.');
        }

        const text = args.join(' ').trim();

        if (!text) {
            return message.reply('Utilisation : `+setconditions votre texte ici`');
        }

        if (text.length > 4000) {
            return message.reply('Le texte des conditions ne peut pas dépasser **4000 caractères**.');
        }

        guildConfig.set(message.guild.id, 'conditionsText', text);

        await message.reply('Les conditions de partenariat ont été mises à jour.');
    }
};