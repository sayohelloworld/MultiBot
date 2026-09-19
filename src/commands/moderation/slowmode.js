const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'Active le slowmode dans le salon',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply("❌ Tu n'as pas la permission de gérer ce salon.");
        }

        const channel = message.channel;

        const duration = parseInt(args[0]);
        if (!duration || isNaN(duration) || duration < 1 || duration > 21600) {
            return message.reply("❌ Utilisation : `+slowmode <1-21600>` secondes (max 6h)");
        }

        try {
            await channel.setRateLimitPerUser(duration, `Slowmode activé par ${message.author.tag}`);
            message.channel.send(`✅ Slowmode activé pour ${duration} seconde(s).`);
        } catch (err) {
            message.reply("❌ Impossible d'activer le slowmode.");
        }
    }
};
