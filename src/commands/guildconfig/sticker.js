const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    PermissionsBitField
} = require('discord.js');

module.exports = {
    name: 'sticker',
    description: 'Ajoute une image PNG ou GIF comme autocollant au serveur.',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const guild = message.guild;

        if (!guild) {
            return message.reply('❌ Cette commande ne peut être utilisée que dans un serveur.');
        }

        if (
            !guild.members.me.permissions.has(
                PermissionsBitField.Flags.ManageGuildExpressions
            )
        ) {
            return message.reply(
                '❌ Je n’ai pas la permission **Gérer les expressions** sur ce serveur.'
            );
        }

        const attachment = message.attachments.first();

        if (!attachment) {
            return message.reply(
                '❌ Vous devez joindre une image **PNG ou GIF** à votre message.\n\n' +
                '`+sticker` + votre image en pièce jointe'
            );
        }

        const fileName = attachment.name?.toLowerCase() || '';
        const contentType = attachment.contentType?.toLowerCase() || '';

        const isPNG =
            fileName.endsWith('.png') ||
            contentType === 'image/png';

        const isGIF =
            fileName.endsWith('.gif') ||
            contentType === 'image/gif';

        if (!isPNG && !isGIF) {
            return message.reply(
                '❌ Format invalide.\n\n' +
                'L’autocollant doit être une image **PNG ou GIF**.'
            );
        }

        if (attachment.size > 512 * 1024) {
            return message.reply(
                '❌ L’image est trop lourde.\n\n' +
                `**Taille actuelle :** ${(attachment.size / 1024).toFixed(2)} KiB\n` +
                '**Taille maximale :** 512 KiB'
            );
        }

        let stickerName = args.join('_').trim();

        if (!stickerName) {
            stickerName = fileName
                .replace(/\.(png|gif)$/i, '')
                .replace(/[^a-zA-Z0-9_]/g, '_');
        }

        stickerName = stickerName
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 30);

        if (stickerName.length < 2) {
            return message.reply(
                '❌ Le nom du sticker doit contenir au moins **2 caractères**.\n\n' +
                'Vous pouvez utiliser par exemple :\n' +
                '`+sticker mon_sticker`'
            );
        }

        let stickers;

        try {
            stickers = await guild.stickers.fetch();
        } catch (error) {
            console.error(
                `[STICKER] Impossible de récupérer les stickers de ${guild.name}:`,
                error
            );

            return message.reply(
                '❌ Impossible de vérifier les autocollants actuels du serveur.'
            );
        }

        const stickerLimits = {
            0: 5,
            1: 10,
            2: 15,
            3: 30
        };

        const maxStickers =
            stickerLimits[guild.premiumTier] ||
            stickerLimits[0];

        if (stickers.size >= maxStickers) {
            return message.reply(
                '❌ Le serveur a atteint sa limite d’autocollants.\n\n' +
                `**Autocollants :** ${stickers.size}/${maxStickers}\n\n` +
                'Supprimez un autocollant existant avant d’en ajouter un nouveau.'
            );
        }

        try {
            const sticker = await guild.stickers.create({
                file: {
                    attachment: attachment.url,
                    name: attachment.name || `${stickerName}.${isGIF ? 'gif' : 'png'}`
                },
                name: stickerName,
                tags: 'custom',
                reason: `Sticker ajouté par ${message.author.tag}`
            });

            const container = new ContainerBuilder()
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# 🎨 Autocollant ajouté\n\n` +
                        `## ${sticker.name}\n\n` +
                        `**Serveur :** ${guild.name}\n` +
                        `**Ajouté par :** ${message.author}\n` +
                        `**Format :** ${isGIF ? 'GIF' : 'PNG'}\n` +
                        `**ID :** \`${sticker.id}\``
                    )
                )

                .addSeparatorComponents(
                    new SeparatorBuilder()
                )

                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## 📊 Stockage\n\n` +
                        `**Autocollants utilisés :** ${stickers.size + 1}/${maxStickers}\n` +
                        `**Places restantes :** ${maxStickers - (stickers.size + 1)}`
                    )
                );

            await message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error(
                `[STICKER] Erreur lors de la création du sticker sur ${guild.name}:`,
                error
            );

            let errorMessage =
                '❌ Impossible d’ajouter l’autocollant au serveur.';

            if (error.code === 30039) {
                errorMessage =
                    '❌ Le serveur a atteint sa limite d’autocollants.';
            } else if (error.code === 50013) {
                errorMessage =
                    '❌ Je n’ai pas les permissions nécessaires pour ajouter cet autocollant.';
            } else if (error.code === 50035) {
                errorMessage =
                    '❌ Discord a refusé l’autocollant. Vérifiez que le fichier respecte les contraintes de Discord.';
            }

            await message.reply(errorMessage);
        }
    }
};
