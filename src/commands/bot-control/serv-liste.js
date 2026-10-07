const config = require("../../../config.js");
const {
    EmbedBuilder,
    PermissionFlagsBits,
    ChannelType
} = require("discord.js");

module.exports = {
    name: "guildmanager",
    description: "Lister ou quitter un serveur du bot",
    usage: "+guildmanager <list | leave> [guildID]",

    async execute(client, message, args) {

        if (message.author.id !== config.ownerId) {
            return message.reply("Tu n'as pas la permission d'utiliser cette commande.");
        }

        const subcommand = args[0]?.toLowerCase();

        if (subcommand === "list") {

            const guilds = [...client.guilds.cache.values()];

            if (!guilds.length) {
                return message.reply("Le bot n'est dans aucun serveur.");
            }

            let embed = new EmbedBuilder()
                .setTitle("📡 Serveurs du bot")
                .setColor(0x5865F2);

            let embeds = [];
            let length = 0;

            for (const guild of guilds) {

                let invite = "Impossible";

                try {
                    const channel = guild.channels.cache.find(c =>
                        c.type === ChannelType.GuildText &&
                        c.permissionsFor(guild.members.me)
                            ?.has(PermissionFlagsBits.CreateInstantInvite)
                    );

                    if (channel) {
                        const inv = await channel.createInvite({
                            maxAge: 0,
                            maxUses: 0
                        });

                        invite = inv.url;
                    }
                } catch {}

                const text =
                    `**${guild.name}**\n` +
                    `ID : \`${guild.id}\`\n` +
                    `Membres : ${guild.memberCount}\n` +
                    `Invitation : ${invite}\n\n`;

                if (
                    length + text.length > 5500 ||
                    embed.data.fields?.length >= 25
                ) {
                    embeds.push(embed);

                    embed = new EmbedBuilder()
                        .setTitle("📡 Serveurs du bot (suite)")
                        .setColor(0x5865F2);

                    length = 0;
                }

                embed.addFields({
                    name: guild.name,
                    value:
                        `\`${guild.id}\`\n` +
                        `👥 ${guild.memberCount} membres\n` +
                        `🔗 ${invite}`
                });

                length += text.length;
            }

            embeds.push(embed);

            for (const e of embeds) {
                await message.channel.send({
                    embeds: [e]
                });
            }

            return;
        }

        if (subcommand === "leave") {

            const guildId = args[1];

            if (!guildId) {
                return message.reply("Donne l'ID du serveur.");
            }

            try {
                const guild = await client.guilds.fetch(guildId).catch(() => null);

                if (!guild) {
                    return message.reply("Serveur introuvable ou bot non présent.");
                }

                await guild.leave();

                return message.reply(
                    `✅ Le bot a quitté : **${guild.name}** (${guild.id})`
                );

            } catch (err) {
                console.error(err);
                return message.reply("Erreur lors du leave du serveur.");
            }
        }

        return message.reply(
            "Utilisation :\n" +
            "`+guildmanager list` → voir les serveurs\n" +
            "`+guildmanager leave <guildID>` → quitter un serveur"
        );
    }
};
