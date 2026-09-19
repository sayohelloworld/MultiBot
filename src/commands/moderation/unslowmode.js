const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unslowmode',
    description: 'Désactive le slowmode dans le salon',

    async execute(client, message) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply("❌ Tu n'as pas la permission de gérer ce salon.");
        }

        const channel = message.channel;

        try {
            await channel.setRateLimitPerUser(0, `Slowmode désactivé par ${message.author.tag}`);
            message.channel.send("✅ Slowmode désactivé.");
        } catch (err) {
            message.reply("❌ Impossible de désactiver le slowmode.");
        }
    }
};
