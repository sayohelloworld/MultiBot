const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} = require("discord.js");

const config = require("../../../config.js");
const guildConfig = require("../../utils/guildConfig");

const categoryNames = {
    automod: "🛡️・Automod",
    avatar: "🎨・Avatars",
    backup: "💾・Backups",
    birthday: "🎂・Anniversaires",
    confession: "💌・Confessions",
    guildconfig: "⚙️・Guild Config",
    economy: "💰・Economie",
    fun: "🎉・Fun",
    games: "🎮・Jeux",
    giveaway: "🎁・Giveaways",
    honeypot: "🐝・Honeypot",
    info: "🔍・Informations",
    levels: "📈・Level",
    moderation: "⚔️・Moderation",
    music: "🎵・Musique",
    other: "🔧・Autres",
    owner: "👑・Owner",
    pfps: "🖼️・PFPs",
    points: "⭐・Points",
    roblox: "🎮・Roblox",
    utility: "🛠️・Utilitaires",
    voice: "🎙️・Vocal",
};

module.exports = {
    name: "help",
    description: "Menu d'aide (Components V2)",

    async execute(client, message) {
        await message.channel.sendTyping();
        const prefix = guildConfig.get(message.guild.id, "prefix") || "+";

        const categories = {};

        client.commands.forEach(cmd => {
            const cat = cmd.category || "other";
            const name = categoryNames[cat] || cat;

            if (!categories[name]) categories[name] = [];

            categories[name].push({
                name: `${prefix}${cmd.name}`,
                description: cmd.description || "Pas de description",
            });
        });

        const totalCommands = Object.values(categories).flat().length;
        const categoryKeys = Object.keys(categories);

        function buildHome() {
            const container = new ContainerBuilder()
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent("## 🏡 Menu d'aide")
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "📌 Sélectionne une catégorie avec le menu ci-dessous.\n\n" +
                    "⚙️ Syntaxe :\n" +
                    "`<...>` obligatoire\n" +
                    "`[...]` optionnel"
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `📊 **Stats**\n` +
                    `• Prefix : \`${prefix}\`\n` +
                    `• Commandes : **${totalCommands}**\n` +
                    `• Serveurs : **${client.guilds.cache.size}**`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `👑 **Développeurs**\n` +
                    `• <@${config.ownerId}>`
                )
            );

            return container;
        }

        function buildCategory(catName, page = 0) {
            const commands = categories[catName];
            const perPage = 10;
            const slice = commands.slice(page * perPage, (page + 1) * perPage);

            const container = new ContainerBuilder()
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 📂 ${catName}`)
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    slice.map(c =>
                        `**\`${c.name}\`**\n${c.description}`
                    ).join("\n\n")
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder().setDivider(true)
            );

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `-# Page ${page + 1}/${Math.ceil(commands.length / perPage)}`
                )
            );

            return container;
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId("help_select")
            .setPlaceholder("📂 Choisir une catégorie...")
            .addOptions(
                categoryKeys.map((cat, i) => ({
                    label: cat,
                    description: `${categories[cat].length} commande(s)`,
                    value: String(i),
                }))
            );

        const rowSelect = new ActionRowBuilder().addComponents(select);

        const rowNav = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("help_home")
                .setLabel("🏡 Accueil")
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId("help_back")
                .setLabel("◀")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId("help_next")
                .setLabel("▶")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId("help_close")
                .setLabel("✖")
                .setStyle(ButtonStyle.Danger)
        );

        const URL = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`;

        const rowLink = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("💬 Support")
                .setStyle(ButtonStyle.Link)
                .setURL(config.supportServerInvite)
        );

        const rowInvite = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("➕ Invite")
                .setStyle(ButtonStyle.Link)
                .setURL(URL)
        );

        const msg = await message.channel.send({
            components: [buildHome(), rowSelect, rowNav, rowLink, rowInvite],
            flags: MessageFlags.IsComponentsV2,
        });

        let currentCategory = null;
        let page = 0;

        const perPage = 10;

        const collector = msg.createMessageComponentCollector({
            time: 180000,
        });

        const updateNav = (cmds) => {
            rowNav.components[1].setDisabled(page === 0);
            rowNav.components[2].setDisabled((page + 1) * perPage >= cmds.length);
        };

        collector.on("collect", async i => {
            if (i.user.id !== message.author.id) {
                return i.reply({ content: "❌ Pas ton menu.", ephemeral: true });
            }

            if (i.isStringSelectMenu()) {
                const index = parseInt(i.values[0]);
                currentCategory = categoryKeys[index];
                page = 0;

                const cmds = categories[currentCategory];
                updateNav(cmds);

                return i.update({
                    components: [
                        buildCategory(currentCategory, page),
                        rowSelect,
                        rowNav,
                        rowLink,
                        rowInvite,
                    ],
                });
            }

            if (i.customId === "help_close") {
                await i.update({
                    content: "✖ Fermé.",
                    components: [],
                });
                return collector.stop();
            }

            if (i.customId === "help_home") {
                currentCategory = null;
                page = 0;

                rowNav.components[1].setDisabled(true);
                rowNav.components[2].setDisabled(true);

                return i.update({
                    components: [
                        buildHome(),
                        rowSelect,
                        rowNav,
                        rowLink,
                        rowInvite,
                    ],
                });
            }

            if (!currentCategory) {
                return i.reply({
                    content: "❌ Choisis une catégorie d'abord.",
                    ephemeral: true,
                });
            }

            const cmds = categories[currentCategory];

            if (i.customId === "help_back") page--;
            if (i.customId === "help_next") page++;

            updateNav(cmds);

            return i.update({
                components: [
                    buildCategory(currentCategory, page),
                    rowSelect,
                    rowNav,
                    rowLink,
                    rowInvite,
                ],
            });
        });

        collector.on("end", () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    },
};
