const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'calcul',
    description: 'Effectue un calcul mathématique',

    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!args.length) {
            return message.reply("Utilisation : `+calcul 2+2`");
        }

        const expression = args.join(" ").trim();

       
        if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
            return message.reply("Expression invalide. Seuls les chiffres et `+ - * / ( )` sont autorisés.");
        }

        try {
           
            const result = Function(`"use strict"; return (${expression})`)();

            if (result === undefined || isNaN(result)) {
                return message.reply("Calcul invalide.");
            }

            const embed = new EmbedBuilder()
                .setTitle('🧮 Calculatrice')
                .addFields(
                    { name: 'Expression', value: `\`${expression}\`` },
                    { name: 'Résultat', value: `\`${result}\`` }
                )
                .setColor('#5865F2')
                .setTimestamp();

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            message.reply("Expression invalide. Exemple : `+calcul 5*(3+2)`");
        }
    }
};
