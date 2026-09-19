const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'untimeout',
    description: 'Retire le timeout d’un membre',

    async execute(client, message, args) {
        if (!message.guild) return;

        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply("❌ Tu n'as pas la permission de retirer le timeout.");
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply("❌ Mentionne un membre.");

        if (!member.moderatable) {
            return message.reply("❌ Je ne peux pas retirer le timeout de ce membre (rôle trop haut ?).");
        }

        try {
            await member.timeout(null, `Timeout retiré par ${message.author.tag}`);
            message.channel.send(`✅ Le timeout de ${member.user.tag} a été retiré.`);
        } catch (err) {
            message.reply("❌ Impossible de retirer le timeout.");
        }
    }
};
