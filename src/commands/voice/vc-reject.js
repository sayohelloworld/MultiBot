const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-reject',
    description: 'Empêche un utilisateur de rejoindre ton vocal',
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
                '❌ Utilisation : `+vc-reject @utilisateur`'
            );
        }

        await channel.permissionOverwrites.edit(
            member.id,
            {
                ViewChannel: false,
                Connect: false
            }
        );

        if (member.voice.channelId === channel.id) {
            await member.voice.disconnect().catch(() => {});
        }

        return message.reply(
            `✅ ${member} ne peut plus rejoindre ton salon vocal.`
        );
    }
};
