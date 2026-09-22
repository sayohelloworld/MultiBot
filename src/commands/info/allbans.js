const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'allbans',
    description: 'Affiche la liste des utilisateurs bannis du serveur',
    async execute(client, message, args) {
        await message.channel.sendTyping();
        if (!message.guild) return;
        const bans = await message.guild.bans.fetch();
        if (bans.size === 0) {
            return message.reply("Aucun utilisateur banni trouvé sur ce serveur.");
        }
        const banList = bans
            .map(ban => `• ${ban.user.tag} (Raison : ${ban.reason || 'Aucune raison fournie'})`)
            .join('\n');
        const embed = new EmbedBuilder()
            .setTitle('<a:Frog_ban_MJ:1548312673903575050> Liste des Utilisateurs Bannis')
            .setDescription(banList)
            .setColor('#2f3136')
            .setFooter({ text: `Total : ${bans.size} utilisateur(s) banni(s)` })
            .setTimestamp();
        message.channel.send({ embeds: [embed] });
    }
};
