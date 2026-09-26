const {
    PermissionFlagsBits
} = require('discord.js');

const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-rename',
    description: 'Renomme ton salon vocal temporaire',
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

        const name = args.join(' ').trim();

        if (!name) {
            return message.reply(
                '❌ Utilisation : `+vc-rename <nom>`'
            );
        }

        if (name.length > 100) {
            return message.reply(
                '❌ Le nom ne peut pas dépasser 100 caractères.'
            );
        }

        await channel.setName(name);

        return message.reply(
            `✅ Salon renommé en **${name}**.`
        );
    }
};
