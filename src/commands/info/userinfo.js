const {
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: "Afficher les informations d'un utilisateur",

    async execute(client, message, args) {
        await message.channel.sendTyping();
        let user;

        if (args.length > 0) {
            const mention = message.mentions.users.first();

            if (mention) {
                user = mention;
            } else {
                try {
                    user = await client.users.fetch(args[0]);
                } catch {
                    return message.channel.send('❌ Utilisateur non trouvé.');
                }
            }
        } else {
            user = message.author;
        }

        const fetchedUser = await client.users.fetch(user.id).catch(() => user);
        const member = await message.guild.members.fetch(user.id).catch(() => null);

        const avatarURL = user.displayAvatarURL({ size: 256 });
        const bannerURL = fetchedUser.bannerURL?.({ size: 1024 }) ?? null;

        const color = member?.displayColor || 0x5865F2;

        const roles = member
            ? member.roles.cache
                .filter(r => r.id !== message.guild.id)
                .sort((a, b) => b.position - a.position)
                .map(r => r.name)
                .join(', ') || 'Aucun'
            : 'Non membre';

        const roleCount = member
            ? member.roles.cache.filter(r => r.id !== message.guild.id).size
            : 0;

        const container = new ContainerBuilder()
            .setAccentColor(color);

        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ${user.tag}${user.bot ? ' 🤖' : ''}\n` +
                        (member?.nickname ? `**Surnom :** ${member.nickname}\n` : '') +
                        `🆔 \`${user.id}\``
                    )
                )
                .setThumbnailAccessory(
                    new ThumbnailBuilder().setURL(avatarURL)
                )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 📅 Dates\n` +
                `🛠️ Créé : <t:${Math.floor(user.createdTimestamp / 1000)}:F>\n` +
                (member
                    ? `📥 Rejoint : <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
                    : '')
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `### 🎖️ Rôles (${roleCount})\n${roles}`
            )
        );

        if (bannerURL) {
            container.addSeparatorComponents(
                new SeparatorBuilder().setSpacing(1)
            );

            container.addMediaGalleryComponents(
                new MediaGalleryBuilder().addItems(
                    new MediaGalleryItemBuilder()
                        .setURL(bannerURL)
                        .setDescription(`Bannière de ${user.tag}`)
                )
            );
        }

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(1)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# Demandé par ${message.author.tag}`
            )
        );

        await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
