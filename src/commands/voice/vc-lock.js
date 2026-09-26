const {
    PermissionFlagsBits
} = require('discord.js');

const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-lock',
    description: 'Verrouille ton salon vocal',
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

        await channel.permissionOverwrites.edit(
            message.guild.roles.everyone,
            {
                Connect: false
            }
        );

        return message.reply(
            '🔒 Ton salon vocal est maintenant verrouillé.'
        );
    }
};
