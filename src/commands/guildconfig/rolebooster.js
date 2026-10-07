const {
    PermissionsBitField
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "rolebooster",
    description: "Récupère les rôles boosters du serveur.",

    async execute(client, message, args) {
        if (!message.guild) {
            return message.reply("❌ Cette commande doit être utilisée sur un serveur.");
        }

        const config = guildConfig.getAll(message.guild.id);

        if (!Array.isArray(config.boosterRoles) || config.boosterRoles.length === 0) {
            return message.reply(
                "❌ Aucun rôle booster n'est configuré sur ce serveur."
            );
        }

        if (!message.member.premiumSince) {
            return message.reply(
                "❌ Tu dois actuellement booster le serveur pour utiliser cette commande."
            );
        }

        const botMember = message.guild.members.me;

        if (!botMember) {
            return message.reply("❌ Impossible de récupérer mon membre sur ce serveur.");
        }

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Je n'ai pas la permission de gérer les rôles.");
        }

        const added = [];
        const unavailable = [];

        for (const roleId of config.boosterRoles) {
            const role = message.guild.roles.cache.get(roleId);

            if (!role || role.managed || role.position >= botMember.roles.highest.position) {
                unavailable.push(roleId);
                continue;
            }

            if (message.member.roles.cache.has(role.id)) {
                continue;
            }

            try {
                await message.member.roles.add(
                    role,
                    "Attribution du rôle booster"
                );

                added.push(role);
            } catch {
                unavailable.push(roleId);
            }
        }

        if (added.length === 0) {
            return message.reply(
                unavailable.length > 0
                    ? "❌ Aucun rôle booster n'a pu être attribué."
                    : "ℹ️ Tu possèdes déjà tous les rôles boosters."
            );
        }

        return message.reply(
            `✅ Rôles booster attribués : ${added.join(", ")}`
        );
    }
};
