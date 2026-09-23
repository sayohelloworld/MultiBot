const { MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { getModule, saveModule, isAdministrator } = require('../../utils/securityConfig');

module.exports = {
    name: 'blacklist',
    description: 'Gère la blacklist',

    async execute(client, message, args) {
        if (!isAdministrator(message.member)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const mod = getModule(message.guild.id, 'blacklist');
        const type = args[0]?.toLowerCase();
        const action = args[1]?.toLowerCase();

        if (!type || type === 'config') {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 🚫 Blacklist\n\n` +
                    `**Membres** : ${mod.users.length}\n` +
                    `**Rôles** : ${mod.roles.length}`
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
            saveModule(message.guild.id, 'blacklist', mod);
            return message.reply('✅ Blacklist vidée.');
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
        } else {
            return message.reply('❌ Type invalide : user, role ou clear.');
        }

        saveModule(message.guild.id, 'blacklist', mod);
        return message.reply('✅ Blacklist mise à jour.');
    }
};
