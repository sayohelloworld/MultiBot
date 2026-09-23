const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { getModule, saveModule, isAdministrator } = require('../../utils/securityConfig');

module.exports = {
    name: 'antimassmention',
    description: 'Protection anti-mentions massives',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        if (!isAdministrator(message.member)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const mod = getModule(message.guild.id, 'antimassmention');
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'config') {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## Protection anti-mentions massives\n\n` +
                    `**Statut** : ${mod.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
                    `**Action** : ${mod.action || 'Aucune'}`
                )
            );
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1).setDivider(true)
            );
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# "+antimassmention on" · "+antimassmention off" · "+antimassmention action <action>"`
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (sub === 'on' || sub === 'off') {
            mod.enabled = sub === 'on';
            saveModule(message.guild.id, 'antimassmention', mod);
            return message.reply(
                `✅ **Protection anti-mentions massives** ${mod.enabled ? 'activé' : 'désactivé'}.`
            );
        }

        if (sub === 'action') {
            const action = args[1]?.toLowerCase();
            const actions = ['delete', 'timeout', 'kick', 'ban'];

            if (!actions.includes(action)) {
                return message.reply(
                    `❌ Actions disponibles : ${actions.map(a => '`' + a + '`').join(' · ')}`
                );
            }

            mod.action = action;
            saveModule(message.guild.id, 'antimassmention', mod);

            return message.reply(`✅ Action définie sur **${action}**.`);
        }

        return message.reply(
            `❌ Sous-commande inconnue. Utilisez "+antimassmention config".`
        );
    }
};
