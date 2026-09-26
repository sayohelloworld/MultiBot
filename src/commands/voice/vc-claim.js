const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-claim',
    description: 'Récupère un salon vocal dont le propriétaire est parti',
    category: 'utility',

    async execute(client, message, args) {
        if (!message.guild) return;

        const channel = message.member.voice.channel;

        if (!channel) {
            return message.reply('❌ Tu dois être dans un salon vocal.');
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

        if (data.ownerId === message.author.id) {
            return message.reply(
                '❌ Tu es déjà propriétaire de ce salon.'
            );
        }

        const owner = message.guild.members.cache.get(
            data.ownerId
        );

        if (owner) {
            return message.reply(
                '❌ Le propriétaire actuel est toujours sur le serveur.'
            );
        }

        voiceManager.addChannel(
            message.guild.id,
            channel.id,
            message.author.id
        );

        return message.reply(
            '👑 Tu es maintenant propriétaire de ce salon vocal.'
        );
    }
};
