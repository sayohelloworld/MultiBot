const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { getModule, saveModule, isAdministrator } = require('../../utils/securityConfig');

module.exports = {
    name: 'set-timeout',
    description: 'Configure le timeout automatique',

    async execute(client, message, args) {
        if (!isAdministrator(message.member)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const mod = getModule(message.guild.id, 'timeout');
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'config') {
            const minutes = Math.round(mod.duration / 60000);

            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ⏱️ Timeout\n\n` +
                    `**Statut** : ${mod.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
                    `**Durée** : ${minutes} minute(s)`
                )
            );
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1).setDivider(true)
            );
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    '-# +set-timeout on · +set-timeout off · +set-timeout duration <minutes>'
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (sub === 'on' || sub === 'off') {
            mod.enabled = sub === 'on';
            saveModule(message.guild.id, 'timeout', mod);
            return message.reply(`✅ Timeout ${mod.enabled ? 'activé' : 'désactivé'}.`);
        }

        if (sub === 'duration') {
            const minutes = Number(args[1]);

            if (!Number.isInteger(minutes) || minutes < 1 || minutes > 28 * 24 * 60) {
                return message.reply('❌ Durée invalide.');
            }

            mod.duration = minutes * 60000;
            saveModule(message.guild.id, 'timeout', mod);

            return message.reply(`✅ Durée définie à **${minutes} minute(s)**.`);
        }

        return message.reply('❌ Sous-commande inconnue.');
    }
};
