const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-limit',
    description: 'Définit la limite de ton salon vocal',
    category: 'utility',

    async execute(client, message, args) {
        if (!message.guild) return;

        const channel = message.member.voice.channel;

        if (!channel) {
            return message.reply('❌ Tu dois être dans ton salon vocal.');
        }

        const data = voiceManager.getChannel(
            message.guild.id,
            channel.id
        );

        if (!data) {
            return message.reply(
                '❌ Ce salon n’est pas un salon vocal temporaire.'
            );
        }

        if (data.ownerId !== message.author.id) {
            return message.reply(
                '❌ Tu n’es pas le propriétaire de ce salon.'
            );
        }

        const limit = Number(args[0]);

        if (!Number.isInteger(limit) || limit < 0 || limit > 99) {
            return message.reply(
                '❌ Utilisation : `+vc-limit <0-99>`\n`0` signifie aucune limite.'
            );
        }

        await channel.setUserLimit(limit);

        return message.reply(
            `✅ Limite définie à **${limit === 0 ? 'illimitée' : limit}** utilisateur(s).`
        );
    }
};
