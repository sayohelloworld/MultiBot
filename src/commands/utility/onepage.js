const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require("discord.js");
const guildConfig = require("../../utils/guildConfig");

const categoryNames = {
    antiraid: "🛡️・AntiRaid",
    avatar: "🎨・Avatars",
    backup: "💾・Backups",
    birthday: "🎂・Anniversaires",
    confession: "💌・Confessions",
    config: "⚙️・Configuration",
    economy: "💰・Economie",
    fun: "🎉・Fun",
    games: "🎮・Jeux",
    giveaway: "🎁・Giveaways",
    info: "🔍・Informations",
    levels: "📈・Level",
    moderation: "⚔️・Moderation",
    music: "🎵・Musique",
    other: "🔧・Autres",
    owner: "👑・Owner",
    points: "⭐・Points",
    roblox: "🎮・Roblox",
    utility: "🛠️・Utilitaires",
    voice: "🎙️・Vocal",
};

module.exports = {
    name: "onepage",
    description: "Affiche toutes les commandes",

    async execute(client, message) {
        await message.channel.sendTyping();
        const prefix = guildConfig.get(message.guild.id, "prefix") || "+";

        const categories = {};

        client.commands.forEach(cmd => {
            const category = categoryNames[cmd.category] || "🔧・Autres";

            if (!categories[category]) categories[category] = [];

            categories[category].push(
                `\`${prefix}${cmd.name}\` - ${cmd.description || "Pas de description"}`
            );
        });

        const pages = [];
        let embed = createEmbed(client);
        let chars = 0;
        let fields = 0;

        for (const [category, commands] of Object.entries(categories)) {

            let text = commands.join("\n");

            const parts = text.match(/[\s\S]{1,1000}/g) || [];

            for (let i = 0; i < parts.length; i++) {

                const fieldName = i === 0 ? category : `${category} (suite)`;

                if (
                    chars + parts[i].length > 5000 ||
                    fields >= 24
                ) {
                    pages.push(embed);

                    embed = createEmbed(client);
                    chars = 0;
                    fields = 0;
                }

                embed.addFields({
                    name: fieldName,
                    value: parts[i],
                    inline: false
                });

                chars += parts[i].length;
                fields++;
            }
        }

        if (embed.data.fields?.length) {
            pages.push(embed);
        }

        let page = 0;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("prev")
                    .setEmoji("◀️")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("next")
                    .setEmoji("▶️")
                    .setStyle(ButtonStyle.Secondary)
            );

        const msg = await message.channel.send({
            embeds: [pages[page]],
            components: pages.length > 1 ? [row] : []
        });

        if (pages.length <= 1) return;

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120000
        });

        collector.on("collect", async interaction => {

            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: "❌ Tu ne peux pas utiliser ces boutons.",
                    ephemeral: true
                });
            }

            if (interaction.customId === "next") {
                page++;
                if (page >= pages.length) page = 0;
            }

            if (interaction.customId === "prev") {
                page--;
                if (page < 0) page = pages.length - 1;
            }

            await interaction.update({
                embeds: [pages[page]]
            });
        });

        collector.on("end", () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    }
};

function createEmbed(client) {
    return new EmbedBuilder()
        .setColor("#4d59ff")
        .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL()
        })
        .setTitle("📋 Liste complète des commandes")
        .setFooter({
            text: "Navigation avec les boutons"
        })
        .setTimestamp();
}
