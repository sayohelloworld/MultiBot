const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-owner',
    description: 'Transfère la propriété de ton salon vocal',
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

        const member = message.mentions.members.first();

        if (!member) {
            return message.reply(
                '❌ Utilisation : `+vc-owner @utilisateur`'
            );
        }

        if (member.voice.channelId !== channel.id) {
            return message.reply(
                '❌ Cet utilisateur doit être dans ton salon vocal.'
            );
        }

        voiceManager.addChannel(
            message.guild.id,
            channel.id,
            member.id
        );

        return message.reply(
            `👑 ${member} est maintenant propriétaire du salon vocal.`
        );
    }
};
