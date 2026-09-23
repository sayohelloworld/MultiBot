const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require('discord.js');
const { getModule, saveModule, isAdministrator } = require('../../utils/securityConfig');

module.exports = {
    name: 'antidm',
    description: 'Configure la protection DM',

    async execute(client, message, args) {
        if (!isAdministrator(message.member)) {
            return message.reply('❌ Cette commande est réservée aux administrateurs.');
        }

        return message.reply(
            'ℹ️ Discord ne permet pas à un bot de contrôler les DM envoyés entre les membres d’un serveur. Cette protection peut uniquement concerner les DM reçus par le bot.'
        );
    }
};
