const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'rankup',
    description: 'Affiche et configure les informations du Rankup',

    async execute(client, message, args) {
        const config = guildConfig.getAll(message.guild.id);
        const subcommand = args[0]?.toLowerCase();

        if (!subcommand) {
            if (!config.rankupText || !config.rankupStaffText) {
                return message.reply('Les informations du Rankup n’ont pas encore été configurées sur ce serveur.');
            }

            const container1 = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(config.rankupText)
                );

            const container2 = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(config.rankupStaffText)
                );

            await message.channel.send({
                components: [container1],
                flags: MessageFlags.IsComponentsV2
            });

            await message.channel.send({
                components: [container2],
                flags: MessageFlags.IsComponentsV2
            });

            return;
        }

        if (subcommand === 'set' || subcommand === 'set1') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier les informations du Rankup.');
            }

            const text = args.slice(1).join(' ').trim();

            if (!text) {
                return message.reply('Utilisation : `+rankup set <texte>`');
            }

            guildConfig.set(message.guild.id, 'rankupText', text);

            return message.reply('Le premier message du Rankup a été configuré.');
        }

        if (subcommand === 'set2') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier les informations du Rankup.');
            }

            const text = args.slice(1).join(' ').trim();

            if (!text) {
                return message.reply('Utilisation : `+rankup set2 <texte>`');
            }

            guildConfig.set(message.guild.id, 'rankupStaffText', text);

            return message.reply('Le deuxième message du Rankup a été configuré.');
        }

        if (subcommand === 'reset') {
            if (!message.member.permissions.has('ManageGuild')) {
                return message.reply('Vous devez avoir la permission **Gérer le serveur** pour modifier les informations du Rankup.');
            }

            guildConfig.setMany(message.guild.id, {
                rankupText: null,
                rankupStaffText: null
            });

            return message.reply('Les informations du Rankup ont été supprimées.');
        }

        return message.reply('Utilisation : `+rankup`, `+rankup set <texte>`, `+rankup set2 <texte>` ou `+rankup reset`');
    }
};