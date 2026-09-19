const guildConfig = require('../utils/guildConfig');
const economy = require('../utils/economy');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!interaction.guild) return;

        try {
           
            if (interaction.customId === "enable_captcha") {
                guildConfig.set(interaction.guild.id, 'captchaEnabled', true);
                await interaction.reply({ content: "✅ Captcha activé pour ce serveur", ephemeral: true });
            }

            if (interaction.customId === "enable_antiraid") {
                guildConfig.set(interaction.guild.id, 'antiraidEnabled', true);
                await interaction.reply({ content: "🚨 Anti-Raid activé pour ce serveur", ephemeral: true });
            }

           
            if (interaction.customId === 'refresh_balance') {
                const userData = economy.getUserData(interaction.user.id);
                const stats = economy.getUserStats(interaction.user.id);

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle(`💰 Solde de ${interaction.user.username}`)
                    .addFields(
                        { name: '💵 Portefeuille', value: `${userData.cash.toLocaleString()} bobux`, inline: true },
                        { name: '🏦 Banque', value: `${userData.bank.toLocaleString()} bobux`, inline: true },
                        { name: '💎 Total', value: `${stats.total.toLocaleString()} bobux`, inline: true },
                        { name: '📊 Statistiques', value: `Travaux: ${stats.workCount}\nDaily: ${stats.dailyCount}\nTotal gagné: ${stats.totalEarned.toLocaleString()} bobux`, inline: false }
                    )
                    .setFooter({ text: 'Solde mis à jour' })
                    .setTimestamp();

                await interaction.update({ embeds: [embed] });
            }

            if (interaction.customId === 'deposit_all') {
                const userData = economy.getUserData(interaction.user.id);
                if (userData.cash === 0) {
                    return await interaction.reply({ content: '❌ Vous n\'avez pas d\'argent en poche à déposer !', ephemeral: true });
                }

                const success = economy.deposit(interaction.user.id, userData.cash);
                if (!success) {
                    return await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🏦 Dépôt effectué')
                    .setDescription(`Vous avez déposé **${userData.cash.toLocaleString()} bobux** en banque.`)
                    .setFooter({ text: 'Utilisez le bouton 🔄 pour actualiser' });

                await interaction.update({ embeds: [embed] });
            }

            if (interaction.customId === 'withdraw_all') {
                const userData = economy.getUserData(interaction.user.id);
                if (userData.bank === 0) {
                    return await interaction.reply({ content: '❌ Vous n\'avez pas d\'argent en banque à retirer !', ephemeral: true });
                }

                const success = economy.withdraw(interaction.user.id, userData.bank);
                if (!success) {
                    return await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🏦 Retrait effectué')
                    .setDescription(`Vous avez retiré **${userData.bank.toLocaleString()} bobux** de votre banque.`)
                    .setFooter({ text: 'Utilisez le bouton 🔄 pour actualiser' });

                await interaction.update({ embeds: [embed] });
            }

           
            if (interaction.customId.startsWith('lb_')) {
                const parts = interaction.customId.split('_');
                const action = parts[1];
                const page = parseInt(parts[2]);

                if (action === 'prev' && page > 1) {
                   
                    const leaderboardCmd = client.commands.get('leaderboard');
                    if (leaderboardCmd) {
                        await leaderboardCmd.execute(client, interaction.message, [page - 1]);
                    }
                } else if (action === 'next') {
                   
                    const leaderboardCmd = client.commands.get('leaderboard');
                    if (leaderboardCmd) {
                        await leaderboardCmd.execute(client, interaction.message, [page + 1]);
                    }
                } else if (action === 'refresh') {
                   
                    const leaderboardCmd = client.commands.get('leaderboard');
                    if (leaderboardCmd) {
                        await leaderboardCmd.execute(client, interaction.message, [page]);
                    }
                }
            }

           
            if (interaction.customId.startsWith('cf_')) {
                const parts = interaction.customId.split('_');
                const choice = parts[1];
                const bet = parseInt(parts[2]);
                const userId = parts[3];

                if (userId !== interaction.user.id) {
                    return await interaction.reply({ content: '❌ Ce bouton n\'est pas pour vous !', ephemeral: true });
                }

               
                const coinflipCmd = client.commands.get('coinflip');
                if (coinflipCmd) {
                    await coinflipCmd.execute(client, interaction.message, [bet, choice]);
                }
            }

           
            if (interaction.customId.startsWith('slots_replay_')) {
                const userId = interaction.customId.split('_')[2];

                if (userId !== interaction.user.id) {
                    return await interaction.reply({ content: '❌ Ce bouton n\'est pas pour vous !', ephemeral: true });
                }

               
                const slotsCmd = client.commands.get('slots');
                if (slotsCmd) {
                    await slotsCmd.execute(client, interaction.message, []);
                }
            }

        } catch (err) {
            console.log(`Erreur interaction bouton: ${err.message}`);
            try {
                await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
            } catch (e) {
               
            }
        }
    }
};
