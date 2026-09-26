const voiceManager = require('../../utils/voiceManager');

module.exports = {
    name: 'vc-permit',
    description: 'Autorise un utilisateur à rejoindre ton vocal',
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
                '❌ Utilisation : `+vc-permit @utilisateur`'
            );
        }

        await channel.permissionOverwrites.edit(
            member.id,
            {
                ViewChannel: true,
                Connect: true
            }
        );

        return message.reply(
            `✅ ${member} peut maintenant rejoindre ton salon vocal.`
        );
    }
};
