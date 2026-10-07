const {
    PermissionsBitField
} = require("discord.js");

const guildConfig = require("../../utils/guildConfig");

module.exports = {
    name: "roleboosters",
    description: "Configure les rôles attribués aux boosters.",

    async execute(client, message, args) {
        if (!message.guild) {
            return message.reply("❌ Cette commande doit être utilisée sur un serveur.");
        }

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Tu dois avoir la permission de gérer les rôles.");
        }

        const action = args[0]?.toLowerCase();

        if (!["add", "remove", "clear"].includes(action)) {
            return message.reply(
                "❌ Utilisation : `+roleboosters add @role`, `+roleboosters remove @role` ou `+roleboosters clear`."
            );
        }

        const config = guildConfig.getAll(message.guild.id);

        if (!Array.isArray(config.boosterRoles)) {
            config.boosterRoles = [];
        }

        if (action === "clear") {
            config.boosterRoles = [];

            guildConfig.save(message.guild.id, config);

            return message.reply("✅ Tous les rôles boosters ont été supprimés de la configuration.");
        }

        const role =
            message.mentions.roles.first() ||
            message.guild.roles.cache.get(args[1]);

        if (!role) {
            return message.reply("❌ Mentionne un rôle valide.");
        }

        if (role.id === message.guild.id) {
            return message.reply("❌ Le rôle @everyone ne peut pas être utilisé.");
        }

        if (role.managed) {
            return message.reply("❌ Ce rôle est géré par Discord et ne peut pas être attribué.");
        }

        const botMember = message.guild.members.me;

        if (!botMember) {
            return message.reply("❌ Impossible de récupérer mon membre sur ce serveur.");
        }

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("❌ Je n'ai pas la permission de gérer les rôles.");
        }

        if (role.position >= botMember.roles.highest.position) {
            return message.reply("❌ Mon rôle doit être placé au-dessus de ce rôle.");
        }

        if (role.position >= message.member.roles.highest.position) {
            return message.reply("❌ Tu ne peux pas gérer un rôle placé au-dessus ou au même niveau que ton rôle.");
        }

        if (action === "add") {
            if (config.boosterRoles.includes(role.id)) {
                return message.reply("❌ Ce rôle est déjà configuré comme rôle booster.");
            }

            config.boosterRoles.push(role.id);

            guildConfig.save(message.guild.id, config);

            return message.reply(
                `✅ Le rôle ${role} sera maintenant attribué aux boosters.`
            );
        }

        if (!config.boosterRoles.includes(role.id)) {
            return message.reply("❌ Ce rôle n'est pas configuré comme rôle booster.");
        }

        config.boosterRoles = config.boosterRoles.filter(
            id => id !== role.id
        );

        guildConfig.save(message.guild.id, config);

        return message.reply(
            `✅ Le rôle ${role} ne sera plus attribué aux boosters.`
        );
    }
};
