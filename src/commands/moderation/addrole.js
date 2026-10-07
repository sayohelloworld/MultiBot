const {
    PermissionsBitField
} = require("discord.js");

module.exports = {
    name: "deleterole",
    description: "Supprime un rôle.",

    async execute(client, message, args) {
        if (!message.guild) {
            return message.reply("❌ Cette commande doit être utilisée sur un serveur.");
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Tu dois avoir la permission de gérer les rôles.");
        }

        const role =
            message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[0]);

        if (!role) {
            return message.reply("❌ Mentionne le rôle à supprimer.");
        }

        if (role.id === message.guild.id) {
            return message.reply("❌ Le rôle @everyone ne peut pas être supprimé.");
        }

        if (role.managed) {
            return message.reply("❌ Ce rôle est géré par Discord et ne peut pas être supprimé.");
        }

        const botMember = message.guild.members.me;

        if (!botMember) {
            return message.reply("❌ Impossible de récupérer mon membre.");
        }

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Je n'ai pas la permission de gérer les rôles.");
        }

        if (role.position >= botMember.roles.highest.position) {
            return message.reply("❌ Je ne peux pas supprimer ce rôle.");
        }

        if (role.position >= message.member.roles.highest.position) {
            return message.reply("❌ Tu ne peux pas supprimer ce rôle.");
        }

        const name = role.name;

        await role.delete(
            `Suppression de rôle par ${message.author.tag}`
        );

        return message.reply(
            `✅ Le rôle **${name}** a été supprimé.`
        );
    }
};
