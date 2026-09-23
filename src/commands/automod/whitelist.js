const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { getModule, saveModule, isAdministrator } = require('../../utils/securityConfig');

module.exports = {
    name: 'whitelist',
    description: 'Gère les exemptions de sécurité',

    async execute(client, message, args) {
        if (!isAdministrator(message.member)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const mod = getModule(message.guild.id, 'whitelist');
        const type = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();

        if (!type || type === 'config') {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🛡️ Whitelist\n\n` +
                    `**Membres** : ${mod.users.length}\n` +
                    `**Rôles** : ${mod.roles.length}\n` +
                    `**Salons** : ${mod.channels.length}`
                )
            );
            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (type === 'clear') {
            mod.users = [];
            mod.roles = [];
            mod.channels = [];
            saveModule(message.guild.id, 'whitelist', mod);
            return message.reply('✅ Whitelist vidée.');
        }

        if (type === 'user') {
            const user = message.mentions.users.first();
            if (!user) return message.reply('❌ Mentionnez un membre.');

            if (action === 'add') {
                if (!mod.users.includes(user.id)) mod.users.push(user.id);
            } else if (action === 'remove' || action === 'rm') {
                mod.users = mod.users.filter(id => id !== user.id);
            } else {
                return message.reply('❌ Utilisez add ou remove.');
            }
        } else if (type === 'role') {
            const role = message.mentions.roles.first();
            if (!role) return message.reply('❌ Mentionnez un rôle.');

            if (action === 'add') {
                if (!mod.roles.includes(role.id)) mod.roles.push(role.id);
            } else if (action === 'remove' || action === 'rm') {
                mod.roles = mod.roles.filter(id => id !== role.id);
            } else {
                return message.reply('❌ Utilisez add ou remove.');
            }
        } else if (type === 'channel') {
            const channel = message.mentions.channels.first();
            if (!channel) return message.reply('❌ Mentionnez un salon.');

            if (action === 'add') {
                if (!mod.channels.includes(channel.id)) mod.channels.push(channel.id);
            } else if (action === 'remove' || action === 'rm') {
                mod.channels = mod.channels.filter(id => id !== channel.id);
            } else {
                return message.reply('❌ Utilisez add ou remove.');
            }
        } else {
            return message.reply('❌ Type invalide : user, role, channel ou clear.');
        }

        saveModule(message.guild.id, 'whitelist', mod);
        return message.reply('✅ Whitelist mise à jour.');
    }
};
