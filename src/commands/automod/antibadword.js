const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { getModule, saveModule, isAdministrator } = require('../../utils/securityConfig');

module.exports = {
    name: 'antibadword',
    description: 'Protection anti-mots interdits',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        if (!isAdministrator(message.member)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        const mod = getModule(message.guild.id, 'antibadword');
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'config') {
            const container = new ContainerBuilder();
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## Protection anti-mots interdits\n\n` +
                    `**Statut** : ${mod.enabled ? '🟢 Activé' : '🔴 Désactivé'}\n` +
                    `**Action** : ${mod.action || 'Aucune'}`
                )
            );
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1).setDivider(true)
            );
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# "+antibadword on" · "+antibadword off" · "+antibadword action <action>"`
                )
            );

            return message.channel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        if (sub === 'on' || sub === 'off') {
            mod.enabled = sub === 'on';
            saveModule(message.guild.id, 'antibadword', mod);
            return message.reply(
                `✅ **Protection anti-mots interdits** ${mod.enabled ? 'activé' : 'désactivé'}.`
            );
        }

        if (sub === 'add') {
            const words = args.slice(1)
                .join(' ')
                .split(',')
                .map(word => word.trim().toLowerCase())
                .filter(Boolean);

            if (!words.length) {
                return message.reply('❌ Utilisation : +antibadword add mot1, mot2, phrase');
            }

            for (const word of words) {
                if (!mod.words.includes(word)) mod.words.push(word);
            }

            saveModule(message.guild.id, 'antibadword', mod);
            return message.reply(`✅ ${words.length} élément(s) traité(s).`);
        }

        if (sub === 'remove' || sub === 'rm') {
            const word = args.slice(1).join(' ').trim().toLowerCase();

            if (!word) {
                return message.reply('❌ Utilisation : +antibadword remove mot');
            }

            mod.words = mod.words.filter(item => item !== word);
            saveModule(message.guild.id, 'antibadword', mod);

            return message.reply(`✅ Élément supprimé : \`${word}\`.`);
        }

        if (sub === 'list') {
            return message.reply(
                mod.words.length
                    ? `🚫 **Mots configurés (${mod.words.length})**\n${mod.words.map(w => `• \`${w}\``).join('\n')}`
                    : '📋 La liste est vide.'
            );
        }

        if (sub === 'clear') {
            mod.words = [];
            saveModule(message.guild.id, 'antibadword', mod);
            return message.reply('✅ Liste des mots vidée.');
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
            saveModule(message.guild.id, 'antibadword', mod);

            return message.reply(`✅ Action définie sur **${action}**.`);
        }

        return message.reply(
            `❌ Sous-commande inconnue. Utilisez "+antibadword config".`
        );
    }
};
