const {
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChannelType,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    AttachmentBuilder,
    FileBuilder,
} = require('discord.js');

const guildConfig = require('../utils/guildConfig');
const tickets = require('../utils/tickets');

const fs = require('fs');
const path = require('path');

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 20);
}

function isStaff(member, cat) {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return true;
    }

    return cat.staffRoles.some(roleId =>
        member.roles.cache.has(roleId)
    );
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMessageContent(content) {
    if (!content) return '';

    let result = escapeHtml(content);

    result = result.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    result = result.replace(
        /&lt;@!?(\d+)&gt;/g,
        '<span class="mention">@utilisateur</span>'
    );

    result = result.replace(
        /&lt;@&amp;(\d+)&gt;/g,
        '<span class="mention">@role</span>'
    );

    result = result.replace(
        /&lt;#(\d+)&gt;/g,
        '<span class="mention">#channel</span>'
    );

    result = result.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
    );

    result = result.replace(
        /(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g,
        '<em>$1</em>'
    );

    result = result.replace(
        /`([^`]+)`/g,
        '<code>$1</code>'
    );

    result = result.replace(
        /```([\s\S]*?)```/g,
        '<pre><code>$1</code></pre>'
    );

    result = result.replace(/\n/g, '<br>');

    return result;
}

function formatDate(date) {
    const d = new Date(date);

    return d.toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'medium'
    });
}

function getLogChannel(guild, cfg) {
    const logChannelId =
        cfg.ticketConfig?.logChannelId ||
        cfg.logChannelId;

    if (!logChannelId) return null;

    return guild.channels.cache.get(logChannelId) || null;
}

async function createTicketChannel(
    guild,
    member,
    category,
    ticketConfig
) {
    const newCount =
        (ticketConfig.ticketCount || 0) + 1;

    guildConfig.setNested(
        guild.id,
        'ticketConfig',
        'ticketCount',
        newCount
    );

    const channelName =
        `ticket-${String(newCount).padStart(4, '0')}-${slugify(member.user.username)}`;

    const permOverwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionsBitField.Flags.ViewChannel
            ]
        },
        {
            id: member.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles
            ]
        },
        {
            id: guild.members.me.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageMessages
            ]
        }
    ];

    for (const roleId of category.staffRoles) {
        const role = guild.roles.cache.get(roleId);

        if (!role) continue;

        permOverwrites.push({
            id: roleId,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.AttachFiles
            ]
        });
    }

    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.discordCategoryId || undefined,
        permissionOverwrites: permOverwrites,
        topic:
            `Ticket de ${member.user.tag} | ` +
            `Catégorie: ${category.name} | ` +
            `ID: ${member.id}`
    });

    return {
        channel,
        number: newCount
    };
}

async function sendTicketEmbed(
    channel,
    member,
    category,
    number
) {
    const staffMentions =
        category.staffRoles.length > 0
            ? category.staffRoles
                .map(id => `<@&${id}>`)
                .join(' ')
            : '';

    const container =
        new ContainerBuilder()
            .setAccentColor(0x5865F2);

    const section = new SectionBuilder();

    section.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## 🎫 Ticket #${String(number).padStart(4, '0')} — ${category.name}\n\n` +
            `Bonjour ${member} !\n\n` +
            `Votre ticket a bien été créé dans la catégorie ` +
            `**${category.emoji || '🎫'} ${category.name}**.\n\n` +
            `### 📋 Votre demande\n` +
            `Expliquez clairement votre problème ou votre demande ` +
            `en donnant un maximum de détails utiles.\n\n` +
            `### 📎 Informations utiles\n` +
            `Vous pouvez envoyer des captures d'écran, des vidéos, ` +
            `des fichiers ou tout autre élément permettant au staff ` +
            `de comprendre votre demande.\n\n` +
            `### ⏳ Traitement\n` +
            `Un membre de l'équipe prendra connaissance de votre ticket ` +
            `et vous répondra dès que possible.\n\n` +
            `> ⚠️ Merci de rester patient et de ne pas mentionner ` +
            `inutilement les membres du staff.` +
            (
                staffMentions
                    ? `\n\n**👥 Staff notifié :** ${staffMentions}`
                    : ''
            )
        )
    );

    section.setThumbnailAccessory(
        new ThumbnailBuilder().setURL(
            member.user.displayAvatarURL({
                extension: 'png',
                size: 256
            })
        )
    );

    container.addSectionComponents(section);

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(1)
            .setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**👤 Créé par :** ${member}\n` +
            `**📂 Catégorie :** ${category.emoji || '🎫'} ${category.name}\n` +
            `**📅 Ouvert le :** <t:${Math.floor(Date.now() / 1000)}:F>`
        )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# Ticket #${String(number).padStart(4, '0')}`
        )
    );

    const row =
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_accept')
                .setLabel('Accepter')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
                .setCustomId('ticket_refuse')
                .setLabel('Refuser')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Fermer')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Secondary)
        );

    if (staffMentions) {
        await channel.send({
            content: staffMentions,
            allowedMentions: {
                roles: category.staffRoles
            }
        });
    }

    await channel.send({
        components: [
            container,
            row
        ],
        flags: MessageFlags.IsComponentsV2
    });
}

async function fetchAllMessages(channel) {
    const messages = [];
    let lastId = null;

    while (true) {
        const options = {
            limit: 100
        };

        if (lastId) {
            options.before = lastId;
        }

        const batch =
            await channel.messages.fetch(options);

        if (batch.size === 0) break;

        messages.push(
            ...Array.from(batch.values())
        );

        lastId =
            batch.last().id;

        if (batch.size < 100) break;
    }

    return messages.sort(
        (a, b) =>
            a.createdTimestamp -
            b.createdTimestamp
    );
}

async function generateTranscript(
    channel,
    ticket,
    category,
    closedBy,
    reason
) {
    console.log(
        `[TICKET] Génération du transcript de ${channel.name}...`
    );

    const messages =
        await fetchAllMessages(channel);

    console.log(
        `[TICKET] ${messages.length} messages récupérés pour ${channel.name}.`
    );

    const guild = channel.guild;

    const creator =
        await guild.members.fetch(
            ticket.userId
        ).catch(() => null);

    const creatorName =
        creator?.user?.tag ||
        ticket.userId;

    const creatorAvatar =
        creator?.user?.displayAvatarURL({
            extension: 'png',
            size: 128
        }) ||
        'https://cdn.discordapp.com/embed/avatars/0.png';

    const closedByName =
        closedBy?.user?.tag ||
        closedBy?.tag ||
        'Inconnu';

    const transcriptMessages =
        messages.map(message => {
            const avatar =
                message.author.displayAvatarURL({
                    extension: 'png',
                    size: 128
                });

            const username =
                escapeHtml(
                    message.author.globalName ||
                    message.author.username
                );

            const tag =
                escapeHtml(
                    message.author.tag
                );

            const content =
                formatMessageContent(
                    message.content
                );

            const timestamp =
                formatDate(
                    message.createdAt
                );

            let attachmentsHtml = '';

            if (message.attachments.size > 0) {
                attachmentsHtml = `
                    <div class="attachments">
                        ${Array.from(message.attachments.values())
                            .map(attachment => {
                                const name =
                                    escapeHtml(
                                        attachment.name ||
                                        'Fichier'
                                    );

                                const url =
                                    escapeHtml(
                                        attachment.url
                                    );

                                const isImage =
                                    attachment.contentType &&
                                    attachment.contentType.startsWith('image/');

                                if (isImage) {
                                    return `
                                        <div class="attachment image-attachment">
                                            <a href="${url}" target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src="${url}"
                                                    alt="${name}"
                                                >
                                            </a>

                                            <div class="attachment-name">
                                                ${name}
                                            </div>
                                        </div>
                                    `;
                                }

                                return `
                                    <a
                                        class="file-attachment"
                                        href="${url}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <span class="file-icon">📎</span>

                                        <span>
                                            <strong>${name}</strong>
                                            <small>Ouvrir le fichier</small>
                                        </span>
                                    </a>
                                `;
                            })
                            .join('')}
                    </div>
                `;
            }

            let embedsHtml = '';

            if (message.embeds.length > 0) {
                embedsHtml = `
                    <div class="message-embeds">
                        ${message.embeds.map(embed => {
                            const title =
                                escapeHtml(
                                    embed.title || ''
                                );

                            const description =
                                formatMessageContent(
                                    embed.description || ''
                                );

                            const url =
                                embed.url
                                    ? escapeHtml(embed.url)
                                    : '';

                            if (!title && !description) {
                                return '';
                            }

                            return `
                                <div class="embed">
                                    ${
                                        title
                                            ? (
                                                url
                                                    ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="embed-title">${title}</a>`
                                                    : `<div class="embed-title">${title}</div>`
                                            )
                                            : ''
                                    }

                                    ${
                                        description
                                            ? `<div class="embed-description">${description}</div>`
                                            : ''
                                    }
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }

            return `
                <div class="message">

                    <img
                        class="avatar"
                        src="${escapeHtml(avatar)}"
                        alt=""
                    >

                    <div class="message-body">

                        <div class="message-header">

                            <span class="username">
                                ${username}
                            </span>

                            <span class="tag">
                                ${tag}
                            </span>

                            <span class="timestamp">
                                ${escapeHtml(timestamp)}
                            </span>

                        </div>

                        <div class="message-content">
                            ${
                                content ||
                                '<span class="empty-message">[Message sans contenu]</span>'
                            }
                        </div>

                        ${attachmentsHtml}
                        ${embedsHtml}

                    </div>

                </div>
            `;
        }).join('\n');

    const safeGuildName =
        escapeHtml(guild.name);

    const safeChannelName =
        escapeHtml(channel.name);

    const safeCategory =
        escapeHtml(
            category?.name ||
            ticket.categoryName ||
            'Inconnue'
        );

    const safeCreator =
        escapeHtml(creatorName);

    const safeCreatorAvatar =
        escapeHtml(creatorAvatar);

    const safeClosedBy =
        escapeHtml(closedByName);

    const safeReason =
        escapeHtml(
            reason?.trim() ||
            'Aucune raison fournie.'
        );

    const openedAt =
        formatDate(
            ticket.createdAt
        );

    const closedAt =
        formatDate(
            Date.now()
        );

    const ticketNumber =
        String(ticket.number).padStart(4, '0');

    const html = `<!DOCTYPE html>
<html lang="fr">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Transcript #${ticketNumber} — ${safeGuildName}
    </title>

    <style>

        * {
            box-sizing: border-box;
        }

        html {
            background: #313338;
        }

        body {
            margin: 0;
            background: #313338;
            color: #dbdee1;
            font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                Roboto,
                Helvetica,
                Arial,
                sans-serif;
            font-size: 15px;
        }

        a {
            color: #00aff4;
        }

        .topbar {
            background: #1e1f22;
            border-bottom: 1px solid #111214;
            padding: 18px 28px;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .topbar-inner {
            max-width: 1100px;
            margin: auto;

            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 20px;
        }

        .server {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .server-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            object-fit: cover;
        }

        .server-name {
            font-size: 18px;
            font-weight: 700;
            color: #f2f3f5;
        }

        .server-subtitle {
            color: #949ba4;
            font-size: 13px;
            margin-top: 2px;
        }

        .ticket-number {
            background: #5865f2;
            color: white;

            padding: 7px 12px;

            border-radius: 6px;

            font-size: 13px;
            font-weight: 700;

            white-space: nowrap;
        }

        .container {
            max-width: 1100px;

            margin: 30px auto;

            padding:
                0
                20px
                50px;
        }

        .ticket-card {
            background: #2b2d31;

            border-radius: 8px;

            overflow: hidden;

            margin-bottom: 24px;

            border:
                1px solid

        }

        .ticket-header {
            padding: 24px;

            background: #232428;

            border-bottom:
                1px solid

        }

        .ticket-title {
            margin: 0;

            font-size: 22px;

            color: #f2f3f5;
        }

        .ticket-description {
            color: #b5bac1;

            margin-top: 7px;
        }

        .info-grid {
            display: grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(230px, 1fr)
                );

            gap: 12px;

            padding: 18px;
        }

        .info {
            background: #1e1f22;

            padding: 14px;

            border-radius: 6px;
        }

        .info-label {
            color: #949ba4;

            font-size: 11px;

            text-transform: uppercase;

            font-weight: 700;

            margin-bottom: 5px;
        }

        .info-value {
            color: #f2f3f5;

            word-break: break-word;
        }

        .creator-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .creator-avatar {
            width: 34px;
            height: 34px;

            border-radius: 50%;

            object-fit: cover;
        }

        .close-reason {
            margin:
                0
                18px
                18px;

            background: #1e1f22;

            border-left:
                4px solid


            padding: 15px;

            border-radius: 4px;
        }

        .close-reason-title {
            color: #949ba4;

            font-size: 12px;

            font-weight: 700;

            text-transform: uppercase;

            margin-bottom: 7px;
        }

        .close-reason-content {
            color: #f2f3f5;

            white-space: pre-wrap;

            word-break: break-word;
        }

        .messages {
            background: #313338;

            padding:
                20px
                0;
        }

        .message {
            display: flex;

            gap: 15px;

            padding:
                5px
                24px;

            position: relative;
        }

        .message:hover {
            background:
                rgba(
                    4,
                    4,
                    5,
                    0.06
                );
        }

        .avatar {
            width: 40px;
            height: 40px;

            min-width: 40px;

            border-radius: 50%;

            object-fit: cover;

            margin-top: 2px;
        }

        .message-body {
            min-width: 0;

            flex: 1;
        }

        .message-header {
            display: flex;

            align-items: baseline;

            flex-wrap: wrap;

            gap: 7px;

            line-height: 20px;
        }

        .username {
            color: #f2f3f5;

            font-weight: 600;

            font-size: 15px;
        }

        .tag {
            color: #949ba4;

            font-size: 12px;
        }

        .timestamp {
            color: #949ba4;

            font-size: 11px;
        }

        .message-content {
            color: #dbdee1;

            line-height: 1.5;

            word-wrap: break-word;

            overflow-wrap: anywhere;
        }

        .message-content a {
            color: #00aff4;

            text-decoration: none;
        }

        .message-content a:hover {
            text-decoration: underline;
        }

        .mention {
            background:
                rgba(
                    88,
                    101,
                    242,
                    0.3
                );

            color: #c9cdfb;

            padding:
                1px
                4px;

            border-radius: 3px;
        }

        code {
            background: #1e1f22;

            padding:
                2px
                5px;

            border-radius: 4px;

            font-family:
                Consolas,
                monospace;

            color: #dbdee1;
        }

        pre {
            background: #1e1f22;

            border-radius: 5px;

            padding: 12px;

            overflow-x: auto;
        }

        pre code {
            padding: 0;

            background: transparent;
        }

        .empty-message {
            color: #72767d;

            font-style: italic;
        }

        .attachments {
            display: flex;

            flex-wrap: wrap;

            gap: 10px;

            margin-top: 8px;
        }

        .image-attachment {
            background: #1e1f22;

            border-radius: 6px;

            overflow: hidden;

            max-width: 450px;
        }

        .image-attachment img {
            display: block;

            max-width: 450px;

            max-height: 350px;

            object-fit: contain;
        }

        .attachment-name {
            padding:
                7px
                10px;

            color: #b5bac1;

            font-size: 12px;
        }

        .file-attachment {
            display: flex;

            align-items: center;

            gap: 10px;

            padding: 10px;

            background: #1e1f22;

            border-radius: 6px;

            text-decoration: none;

            color: #dbdee1;
        }

        .file-attachment:hover {
            background: #111214;
        }

        .file-icon {
            font-size: 22px;
        }

        .file-attachment small {
            display: block;

            color: #949ba4;

            margin-top: 2px;
        }

        .message-embeds {
            margin-top: 8px;
        }

        .embed {
            max-width: 520px;

            background: #2b2d31;

            border-left:
                4px solid


            border-radius: 4px;

            padding:
                10px
                12px;
        }

        .embed-title {
            color: #f2f3f5;

            font-weight: 700;

            text-decoration: none;
        }

        .embed-title:hover {
            text-decoration: underline;
        }

        .embed-description {
            margin-top: 5px;

            color: #dbdee1;

            line-height: 1.4;
        }

        .footer {
            text-align: center;

            color: #72767d;

            font-size: 12px;

            padding: 25px;
        }

        @media (max-width: 650px) {

            .topbar {
                padding: 15px;
            }

            .topbar-inner {
                align-items: flex-start;

                flex-direction: column;
            }

            .container {
                margin-top: 15px;

                padding:
                    0
                    10px
                    30px;
            }

            .message {
                padding:
                    5px
                    12px;

                gap: 10px;
            }

            .avatar {
                width: 36px;
                height: 36px;

                min-width: 36px;
            }

            .image-attachment,
            .image-attachment img {
                max-width: 100%;
            }

        }

    </style>

</head>

<body>

    <div class="topbar">

        <div class="topbar-inner">

            <div class="server">

                <img
                    class="server-avatar"
                    src="${escapeHtml(
                        guild.iconURL({
                            extension: 'png',
                            size: 128
                        }) ||
                        'https://cdn.discordapp.com/embed/avatars/0.png'
                    )}"
                    alt=""
                >

                <div>

                    <div class="server-name">
                        ${safeGuildName}
                    </div>

                    <div class="server-subtitle">
                        Transcript du ticket #${ticketNumber}
                    </div>

                </div>

            </div>

            <div class="ticket-number">

            </div>

        </div>

    </div>

    <main class="container">

        <section class="ticket-card">

            <div class="ticket-header">

                <h1 class="ticket-title">
                    🎫 Ticket #${ticketNumber}
                </h1>

                <div class="ticket-description">
                    Transcript complet du ticket
                    <strong>#${safeChannelName}</strong>
                </div>

            </div>

            <div class="info-grid">

                <div class="info">

                    <div class="info-label">
                        Créateur
                    </div>

                    <div class="creator-info">

                        <img
                            class="creator-avatar"
                            src="${safeCreatorAvatar}"
                            alt=""
                        >

                        <div class="info-value">
                            ${safeCreator}
                        </div>

                    </div>

                </div>

                <div class="info">

                    <div class="info-label">
                        Catégorie
                    </div>

                    <div class="info-value">
                        ${safeCategory}
                    </div>

                </div>

                <div class="info">

                    <div class="info-label">
                        Ouvert le
                    </div>

                    <div class="info-value">
                        ${escapeHtml(openedAt)}
                    </div>

                </div>

                <div class="info">

                    <div class="info-label">
                        Fermé le
                    </div>

                    <div class="info-value">
                        ${escapeHtml(closedAt)}
                    </div>

                </div>

                <div class="info">

                    <div class="info-label">
                        Fermé par
                    </div>

                    <div class="info-value">
                        ${safeClosedBy}
                    </div>

                </div>

                <div class="info">

                    <div class="info-label">
                        Messages
                    </div>

                    <div class="info-value">
                        ${messages.length}
                    </div>

                </div>

            </div>

            <div class="close-reason">

                <div class="close-reason-title">
                    Raison de fermeture
                </div>

                <div class="close-reason-content">
                    ${safeReason}
                </div>

            </div>

        </section>

        <section class="ticket-card">

            <div class="ticket-header">

                <h2 class="ticket-title">
                    💬 Messages
                </h2>

                <div class="ticket-description">
                    Historique complet de la conversation
                </div>

            </div>

            <div class="messages">

                ${transcriptMessages}

            </div>

        </section>

        <div class="footer">
            Transcript généré automatiquement par Celestial
            • ${escapeHtml(closedAt)}
        </div>

    </main>

</body>

</html>`;

    const transcriptDir =
        path.join(
            process.cwd(),
            'transcripts'
        );

    if (!fs.existsSync(transcriptDir)) {
        fs.mkdirSync(
            transcriptDir,
            {
                recursive: true
            }
        );
    }

    console.log(
        `[TICKET] Dossier transcript : ${transcriptDir}`
    );

    const filename =
        `ticket-${ticketNumber}-${channel.id}.html`;

    const filepath =
        path.join(
            transcriptDir,
            filename
        );

    console.log(
        `[TICKET] Écriture du fichier HTML : ${filepath}`
    );

    fs.writeFileSync(
        filepath,
        html,
        'utf8'
    );

    if (!fs.existsSync(filepath)) {
        throw new Error(
            `Le fichier transcript n'existe pas après écriture : ${filepath}`
        );
    }

    const stats =
        fs.statSync(filepath);

    console.log(
        `[TICKET] Transcript HTML vérifié : ${filepath} (${stats.size} octets)`
    );

    if (stats.size === 0) {
        throw new Error(
            'Le fichier transcript HTML a été créé mais il est vide.'
        );
    }

    return {
        filepath,
        filename,
        messagesCount: messages.length
    };
}

async function logTicketAction(
    guild,
    cfg,
    action,
    member,
    category,
    channelName,
    reason = null
) {
    const logChannel =
        getLogChannel(guild, cfg);

    if (!logChannel) return;

    const colors = {
        open: 0x5865F2,
        accept: 0x57F287,
        refuse: 0xED4245
    };

    const labels = {
        open: '🎫 Ticket ouvert',
        accept: '✅ Ticket accepté',
        refuse: '❌ Ticket refusé'
    };

    const container =
        new ContainerBuilder()
            .setAccentColor(
                colors[action] || 0x5865F2
            );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## ${labels[action] || action}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(1)
            .setDivider(true)
    );

    let content =
        `**👤 Membre :** ${member.user.tag} (${member.id})\n` +
        `**📂 Catégorie :** ${category?.name || 'Inconnue'}\n` +
        `**📋 Channel :** ${channelName || 'N/A'}`;

    if (reason) {
        content +=
            `\n**📝 Raison :** ${reason}`;
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            content
        )
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `-# <t:${Math.floor(Date.now() / 1000)}:F>`
        )
    );

    await logChannel.send({
        components: [
            container
        ],
        flags:
            MessageFlags.IsComponentsV2
    }).catch(err => {
        console.error(
            '[TICKET] Erreur logTicketAction:',
            err
        );
    });
}

async function sendCloseTranscriptLog(
    guild,
    cfg,
    ticket,
    category,
    closedBy,
    reason,
    transcript
) {
    const logChannel =
        getLogChannel(guild, cfg);

    if (!logChannel) {
        throw new Error(
            'Aucun salon de logs configuré.'
        );
    }

    if (!transcript) {
        throw new Error(
            'Aucun transcript disponible.'
        );
    }

    if (!transcript.filepath) {
        throw new Error(
            'Le chemin du transcript est manquant.'
        );
    }

    if (!fs.existsSync(transcript.filepath)) {
        throw new Error(
            `Le fichier transcript est introuvable : ${transcript.filepath}`
        );
    }

    const stats =
        fs.statSync(
            transcript.filepath
        );

    if (stats.size === 0) {
        throw new Error(
            'Le fichier transcript est vide.'
        );
    }

    const ticketNumber =
        String(ticket.number).padStart(4, '0');

    console.log(
        `[TICKET] Fichier transcript confirmé avant envoi : ${transcript.filepath}`
    );

    console.log(
        `[TICKET] Taille du fichier : ${stats.size} octets`
    );

    const fileBuffer =
        fs.readFileSync(
            transcript.filepath
        );

    if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error(
            'Impossible de charger le transcript en Buffer.'
        );
    }

    if (fileBuffer.length === 0) {
        throw new Error(
            'Le Buffer du transcript est vide.'
        );
    }

    console.log(
        `[TICKET] Buffer du transcript chargé : ${fileBuffer.length} octets`
    );

    const attachment =
        new AttachmentBuilder(
            fileBuffer,
            {
                name: transcript.filename,
                description:
                    `Transcript HTML du ticket #${ticketNumber}`
            }
        );

    const fileComponent =
        new FileBuilder()
            .setURL(
                `attachment://${transcript.filename}`
            );

    const container =
        new ContainerBuilder()
            .setAccentColor(0x95A5A6);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `## 🔒 Ticket fermé`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(1)
            .setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**🎫 Ticket :** #${ticketNumber}\n` +
            `**📂 Catégorie :** ${category?.name || ticket.categoryName || 'Inconnue'}\n` +
            `**👤 Créateur :** <@${ticket.userId}>\n` +
            `**🔒 Fermé par :** ${closedBy}\n` +
            `**📝 Raison :** ${reason || 'Aucune raison fournie'}\n` +
            `**💬 Messages :** ${transcript.messagesCount}`
        )
    );

    container.addSeparatorComponents(
        new SeparatorBuilder()
            .setSpacing(1)
            .setDivider(true)
    );

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `📄 **Transcript HTML**\n` +
            `Le transcript complet du ticket est joint ci-dessous.`
        )
    );

    container.addFileComponents(
        fileComponent
    );

    console.log(
        `[TICKET] Envoi du fichier ${transcript.filename} (${fileBuffer.length} octets) dans #${logChannel.name}...`
    );

    const sentMessage =
        await logChannel.send({
            components: [
                container
            ],
            files: [
                attachment
            ],
            flags:
                MessageFlags.IsComponentsV2
        });

    console.log(
        `[TICKET] Message transcript envoyé. Message ID : ${sentMessage.id}`
    );

    console.log(
        `[TICKET] Pièces jointes retournées par Discord : ${sentMessage.attachments.size}`
    );

    for (const sentAttachment of sentMessage.attachments.values()) {
        console.log(
            `[TICKET] Attachment Discord : ${sentAttachment.name} | ${sentAttachment.size} octets | ${sentAttachment.url}`
        );
    }

    const uploadedAttachment =
        sentMessage.attachments.find(
            attachmentItem =>
                attachmentItem.name ===
                transcript.filename
        );

    if (!uploadedAttachment) {
        throw new Error(
            `Discord a accepté le message mais aucune pièce jointe ${transcript.filename} n'est présente dans le message envoyé.`
        );
    }

    console.log(
        `[TICKET] Transcript confirmé côté Discord : ${uploadedAttachment.name}`
    );

    console.log(
        `[TICKET] URL Discord du transcript : ${uploadedAttachment.url}`
    );

    return {
        sentMessage,
        attachment: uploadedAttachment
    };
}

module.exports = {
    name: 'interactionCreate',

    async execute(interaction, client) {
        try {
            if (!interaction.guild) return;

            const { customId } = interaction;

            if (!customId) return;

            const cfg =
                guildConfig.getAll(
                    interaction.guild.id
                );

            const tc =
                cfg.ticketConfig;

            if (!tc || !Array.isArray(tc.categories)) {
                return;
            }

            if (customId.startsWith('ticket_create_')) {
                const catId =
                    customId.replace(
                        'ticket_create_',
                        ''
                    );

                const category =
                    tc.categories.find(
                        c => c.id === catId
                    );

                if (!category) {
                    return interaction.reply({
                        content:
                            '❌ Catégorie introuvable.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const all =
                    tickets.getAll();

                const existing =
                    Object.values(all).find(t =>
                        t.guildId === interaction.guild.id &&
                        t.userId === interaction.user.id &&
                        t.categoryId === category.id &&
                        t.status === 'open'
                    );

                if (existing) {
                    const existCh =
                        interaction.guild.channels.cache.get(
                            existing.channelId
                        );

                    if (existCh) {
                        return interaction.editReply({
                            content:
                                `❌ Tu as déjà un ticket ouvert : ${existCh}`
                        });
                    }
                }

                try {
                    const member =
                        await interaction.guild.members.fetch(
                            interaction.user.id
                        );

                    const {
                        channel,
                        number
                    } = await createTicketChannel(
                        interaction.guild,
                        member,
                        category,
                        tc
                    );

                    tickets.create(
                        channel.id,
                        {
                            channelId: channel.id,
                            guildId: interaction.guild.id,
                            userId: member.id,
                            categoryId: category.id,
                            categoryName: category.name,
                            status: 'open',
                            number,
                            createdAt: Date.now()
                        }
                    );

                    await sendTicketEmbed(
                        channel,
                        member,
                        category,
                        number
                    );

                    await logTicketAction(
                        interaction.guild,
                        cfg,
                        'open',
                        member,
                        category,
                        channel.name
                    );

                    await interaction.editReply({
                        content:
                            `✅ Ton ticket a été créé : ${channel}`
                    });

                } catch (err) {
                    console.error(
                        'Erreur création ticket:',
                        err
                    );

                    await interaction.editReply({
                        content:
                            `❌ Erreur lors de la création du ticket : ${err.message}`
                    }).catch(() => {});
                }

                return;
            }

            if (customId === 'ticket_open_select') {
                return interaction.reply({
                    content:
                        '⬇️ Choisissez une catégorie dans le menu ci-dessous.',
                    flags:
                        MessageFlags.Ephemeral
                });
            }

            if (customId === 'ticket_select_category') {
                if (!interaction.isStringSelectMenu()) return;

                const catId =
                    interaction.values[0];

                const category =
                    tc.categories.find(
                        c => c.id === catId
                    );

                if (!category) {
                    return interaction.reply({
                        content:
                            '❌ Catégorie introuvable.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });

                const all =
                    tickets.getAll();

                const existing =
                    Object.values(all).find(t =>
                        t.guildId === interaction.guild.id &&
                        t.userId === interaction.user.id &&
                        t.categoryId === category.id &&
                        t.status === 'open'
                    );

                if (existing) {
                    const existCh =
                        interaction.guild.channels.cache.get(
                            existing.channelId
                        );

                    if (existCh) {
                        return interaction.editReply({
                            content:
                                `❌ Tu as déjà un ticket ouvert dans cette catégorie : ${existCh}`
                        });
                    }
                }

                try {
                    const member =
                        await interaction.guild.members.fetch(
                            interaction.user.id
                        );

                    const {
                        channel,
                        number
                    } = await createTicketChannel(
                        interaction.guild,
                        member,
                        category,
                        tc
                    );

                    tickets.create(
                        channel.id,
                        {
                            channelId: channel.id,
                            guildId: interaction.guild.id,
                            userId: member.id,
                            categoryId: category.id,
                            categoryName: category.name,
                            status: 'open',
                            number,
                            createdAt: Date.now()
                        }
                    );

                    await sendTicketEmbed(
                        channel,
                        member,
                        category,
                        number
                    );

                    await logTicketAction(
                        interaction.guild,
                        cfg,
                        'open',
                        member,
                        category,
                        channel.name
                    );

                    await interaction.editReply({
                        content:
                            `✅ Ton ticket a été créé : ${channel}`
                    });

                } catch (err) {
                    console.error(
                        'Erreur création ticket:',
                        err
                    );

                    await interaction.editReply({
                        content:
                            `❌ Erreur lors de la création du ticket : ${err.message}`
                    }).catch(() => {});
                }

                return;
            }

            if (customId === 'ticket_accept') {
                if (!interaction.isButton()) return;

                const ticket =
                    tickets.get(
                        interaction.channel.id
                    );

                if (!ticket) {
                    return interaction.reply({
                        content:
                            '❌ Ticket introuvable.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                const category =
                    tc.categories.find(
                        c => c.id === ticket.categoryId
                    );

                const member =
                    await interaction.guild.members.fetch(
                        interaction.user.id
                    ).catch(() => null);

                if (
                    !member ||
                    !isStaff(
                        member,
                        category || {
                            staffRoles: []
                        }
                    )
                ) {
                    return interaction.reply({
                        content:
                            '❌ Seul le staff peut accepter un ticket.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                if (ticket.status !== 'open') {
                    return interaction.reply({
                        content:
                            '❌ Ce ticket est déjà traité.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                tickets.update(
                    interaction.channel.id,
                    {
                        status: 'accepted',
                        acceptedBy: member.id
                    }
                );

                const container =
                    new ContainerBuilder()
                        .setAccentColor(0x57F287);

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ✅ Ticket accepté\n` +
                        `Ce ticket a été **accepté** par ${member}.\n` +
                        `Nous allons traiter votre demande rapidement.`
                    )
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                );

                await interaction.reply({
                    components: [
                        container
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                await logTicketAction(
                    interaction.guild,
                    cfg,
                    'accept',
                    { user: interaction.user },
                    category,
                    interaction.channel.name
                );

                return;
            }

            if (customId === 'ticket_refuse') {
                if (!interaction.isButton()) return;

                const ticket =
                    tickets.get(
                        interaction.channel.id
                    );

                if (!ticket) {
                    return interaction.reply({
                        content:
                            '❌ Ticket introuvable.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                const category =
                    tc.categories.find(
                        c => c.id === ticket.categoryId
                    );

                const member =
                    await interaction.guild.members.fetch(
                        interaction.user.id
                    ).catch(() => null);

                if (
                    !member ||
                    !isStaff(
                        member,
                        category || {
                            staffRoles: []
                        }
                    )
                ) {
                    return interaction.reply({
                        content:
                            '❌ Seul le staff peut refuser un ticket.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                const container =
                    new ContainerBuilder()
                        .setAccentColor(0xED4245);

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## ❌ Ticket refusé\n` +
                        `Ce ticket a été **refusé** par ${member}.\n` +
                        `Le salon sera supprimé dans 5 secondes.`
                    )
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                );

                await interaction.reply({
                    components: [
                        container
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                await logTicketAction(
                    interaction.guild,
                    cfg,
                    'refuse',
                    { user: interaction.user },
                    category,
                    interaction.channel.name
                );

                tickets.update(
                    interaction.channel.id,
                    {
                        status: 'refused'
                    }
                );

                setTimeout(() => {
                    tickets.remove(
                        interaction.channel.id
                    );

                    interaction.channel.delete(
                        'Ticket refusé'
                    ).catch(() => {});
                }, 5000);

                return;
            }

            if (customId === 'ticket_close') {
                if (!interaction.isButton()) return;

                const ticket =
                    tickets.get(
                        interaction.channel.id
                    );

                if (!ticket) {
                    return interaction.reply({
                        content:
                            '❌ Ticket introuvable.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                const category =
                    tc.categories.find(
                        c => c.id === ticket.categoryId
                    );

                const isCreator =
                    interaction.user.id === ticket.userId;

                const member =
                    await interaction.guild.members.fetch(
                        interaction.user.id
                    ).catch(() => null);

                const staff =
                    member &&
                    isStaff(
                        member,
                        category || {
                            staffRoles: []
                        }
                    );

                if (!isCreator && !staff) {
                    return interaction.reply({
                        content:
                            '❌ Seul le créateur du ticket ou le staff peut le fermer.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                if (
                    ticket.status === 'closed' ||
                    ticket.status === 'refused'
                ) {
                    return interaction.reply({
                        content:
                            '❌ Ce ticket est déjà fermé.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                const modal =
                    new ModalBuilder()
                        .setCustomId(
                            'ticket_close_modal'
                        )
                        .setTitle(
                            'Fermer le ticket'
                        );

                const reasonInput =
                    new TextInputBuilder()
                        .setCustomId(
                            'ticket_close_reason'
                        )
                        .setLabel(
                            'Raison de la fermeture'
                        )
                        .setPlaceholder(
                            'Exemple : Demande résolue, ticket inutile, etc.'
                        )
                        .setStyle(
                            TextInputStyle.Paragraph
                        )
                        .setRequired(false)
                        .setMaxLength(1000);

                modal.addComponents(
                    new ActionRowBuilder()
                        .addComponents(
                            reasonInput
                        )
                );

                return interaction.showModal(
                    modal
                );
            }

            if (customId === 'ticket_close_modal') {
                if (!interaction.isModalSubmit()) return;

                const ticket =
                    tickets.get(
                        interaction.channel.id
                    );

                if (!ticket) {
                    return interaction.reply({
                        content:
                            '❌ Ticket introuvable.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                const category =
                    tc.categories.find(
                        c => c.id === ticket.categoryId
                    );

                const isCreator =
                    interaction.user.id === ticket.userId;

                const member =
                    await interaction.guild.members.fetch(
                        interaction.user.id
                    ).catch(() => null);

                const staff =
                    member &&
                    isStaff(
                        member,
                        category || {
                            staffRoles: []
                        }
                    );

                if (!isCreator && !staff) {
                    return interaction.reply({
                        content:
                            '❌ Seul le créateur du ticket ou le staff peut le fermer.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                if (
                    ticket.status === 'closed' ||
                    ticket.status === 'refused'
                ) {
                    return interaction.reply({
                        content:
                            '❌ Ce ticket est déjà fermé.',
                        flags:
                            MessageFlags.Ephemeral
                    });
                }

                let reason = '';

                if (
                    interaction.fields &&
                    interaction.fields.fields.has(
                        'ticket_close_reason'
                    )
                ) {
                    reason =
                        interaction.fields
                            .getTextInputValue(
                                'ticket_close_reason'
                            )
                            .trim();
                }

                const ticketNumber =
                    String(ticket.number).padStart(4, '0');

                console.log(
                    `[TICKET] Fermeture du ticket #${ticketNumber}`
                );

                let transcript = null;
                let transcriptSent = false;

                try {
                    console.log(
                        `[TICKET] Génération du transcript de ${interaction.channel.name}...`
                    );

                    transcript =
                        await generateTranscript(
                            interaction.channel,
                            ticket,
                            category,
                            interaction.user,
                            reason
                        );

                    console.log(
                        `[TICKET] Transcript créé et vérifié : ${transcript.filepath}`
                    );

                } catch (err) {
                    console.error(
                        '[TICKET] ERREUR GÉNÉRATION TRANSCRIPT:',
                        err
                    );
                }

                const container =
                    new ContainerBuilder()
                        .setAccentColor(0x95A5A6);

                let closeContent =
                    `## 🔒 Ticket fermé\n` +
                    `Ce ticket a été **fermé** par ${interaction.user}.\n\n`;

                closeContent +=
                    `**📝 Raison :** ` +
                    `${reason || 'Aucune raison fournie'}\n\n`;

                if (transcript) {
                    closeContent +=
                        `Le transcript du ticket a été généré et envoyé dans les logs.\n`;
                } else {
                    closeContent +=
                        `⚠️ Le transcript n'a pas pu être généré.\n`;
                }

                closeContent +=
                    `Le salon sera supprimé dans 5 secondes.`;

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        closeContent
                    )
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `-# <t:${Math.floor(Date.now() / 1000)}:F>`
                    )
                );

                await interaction.reply({
                    components: [
                        container
                    ],
                    flags:
                        MessageFlags.IsComponentsV2
                });

                if (transcript) {
                    try {
                        await sendCloseTranscriptLog(
                            interaction.guild,
                            cfg,
                            ticket,
                            category,
                            interaction.user,
                            reason,
                            transcript
                        );

                        transcriptSent = true;

                        console.log(
                            `[TICKET] Transcript #${ticketNumber} envoyé et confirmé par Discord.`
                        );

                    } catch (err) {
                        console.error(
                            '[TICKET] ERREUR ENVOI TRANSCRIPT:',
                            err
                        );

                        const logChannel =
                            getLogChannel(
                                interaction.guild,
                                cfg
                            );

                        if (logChannel) {
                            await logChannel.send({
                                content:
                                    `⚠️ **Erreur lors de l'envoi du transcript du ticket #${ticketNumber}**\n` +
                                    `\`\`\`${String(err.message || err).slice(0, 1800)}\`\`\``
                            }).catch(() => {});
                        }
                    }
                } else {
                    console.error(
                        `[TICKET] Aucun transcript disponible pour le ticket #${ticketNumber}.`
                    );
                }

                tickets.update(
                    interaction.channel.id,
                    {
                        status: 'closed',
                        closedBy: interaction.user.id,
                        closeReason:
                            reason || null,
                        closedAt: Date.now(),
                        transcriptSent
                    }
                );

                console.log(
                    `[TICKET] Ticket #${ticketNumber} terminé. Transcript envoyé : ${transcriptSent ? 'OUI' : 'NON'}`
                );

                setTimeout(() => {
                    const channelId =
                        interaction.channel.id;

                    tickets.remove(
                        channelId
                    );

                    interaction.channel.delete(
                        reason
                            ? `Ticket fermé : ${reason}`
                            : 'Ticket fermé'
                    ).catch(() => {});

                }, 5000);

                return;
            }

        } catch (err) {
            console.error(
                'Erreur interactionCreate:',
                err
            );

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {
                await interaction.reply({
                    content:
                        '❌ Une erreur est survenue lors du traitement de cette interaction.',
                    flags:
                        MessageFlags.Ephemeral
                }).catch(() => {});
            }
        }
    }
};
