const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
    AttachmentBuilder,
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

function escapeHTML(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatContent(text) {
    return escapeHTML(text)
        .replace(/\n/g, '<br>')
        .replace(
            /(https?:\/\/[^\s<]+)/g,
            '<a href="$1" target="_blank">$1</a>'
        );
}

function formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'medium'
    }).format(date);
}

module.exports = {
    name: 'transcript',
    description: 'Génère un transcript HTML du salon actuel',

    async execute(client, message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Transcript\nVous devez avoir la permission **Gérer les messages** pour utiliser cette commande.'
                    )
                );

            return message.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }

        const loading = await message.reply({
            components: [
                new ContainerBuilder()
                    .setAccentColor(3604294)
                    .addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            '## Transcript\nRécupération de tous les messages du salon...'
                        )
                    )
            ],
            flags: MessageFlags.IsComponentsV2
        });

        try {
            const messages = [];
            let before;

            while (true) {
                const options = {
                    limit: 100
                };

                if (before) {
                    options.before = before;
                }

                const batch = await message.channel.messages.fetch(options);

                if (batch.size === 0) {
                    break;
                }

                messages.push(...batch.values());

                before = batch.last().id;

                if (batch.size < 100) {
                    break;
                }
            }

            messages.reverse();

            const messageHTML = messages.map(msg => {
                const user = msg.author;

                const avatar = user.displayAvatarURL({
                    extension: 'png',
                    size: 128
                });

                const username = escapeHTML(
                    user.globalName || user.username
                );

                const tag = escapeHTML(user.username);

                const content = formatContent(
                    msg.content || ''
                );

                const botBadge = user.bot
                    ? '<span class="bot-badge">BOT</span>'
                    : '';

                let replyHTML = '';

                if (msg.reference?.messageId) {
                    const repliedMessage = messages.find(
                        m => m.id === msg.reference.messageId
                    );

                    if (repliedMessage) {
                        const repliedUsername = escapeHTML(
                            repliedMessage.author.globalName ||
                            repliedMessage.author.username
                        );

                        const repliedContent = escapeHTML(
                            repliedMessage.content ||
                            'Message sans contenu'
                        );

                        replyHTML = `
                            <div class="reply">
                                <div class="reply-line"></div>
                                <div class="reply-text">
                                    <strong>${repliedUsername}</strong>
                                    <span>${repliedContent}</span>
                                </div>
                            </div>
                        `;
                    }
                }

                let attachmentsHTML = '';

                if (msg.attachments.size > 0) {
                    attachmentsHTML = `
                        <div class="attachments">
                            ${Array.from(msg.attachments.values())
                                .map(attachment => {
                                    const url = escapeHTML(
                                        attachment.url
                                    );

                                    const name = escapeHTML(
                                        attachment.name
                                    );

                                    if (
                                        attachment.contentType &&
                                        attachment.contentType.startsWith(
                                            'image/'
                                        )
                                    ) {
                                        return `
                                            <a href="${url}" target="_blank">
                                                <img
                                                    class="attachment-image"
                                                    src="${url}"
                                                    alt="${name}"
                                                >
                                            </a>
                                        `;
                                    }

                                    return `
                                        <a
                                            class="attachment-file"
                                            href="${url}"
                                            target="_blank"
                                        >
                                            📎 ${name}
                                        </a>
                                    `;
                                })
                                .join('')}
                        </div>
                    `;
                }

                let embedsHTML = '';

                if (msg.embeds.length > 0) {
                    embedsHTML = `
                        <div class="embeds">
                            ${msg.embeds.map(embed => {
                                const title = embed.title
                                    ? `<div class="embed-title">${escapeHTML(embed.title)}</div>`
                                    : '';

                                const description = embed.description
                                    ? `<div class="embed-description">${formatContent(embed.description)}</div>`
                                    : '';

                                const image = embed.image?.url
                                    ? `
                                        <img
                                            class="embed-image"
                                            src="${escapeHTML(embed.image.url)}"
                                        >
                                    `
                                    : '';

                                return `
                                    <div class="embed">
                                        ${title}
                                        ${description}
                                        ${image}
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
                            src="${avatar}"
                            alt="Avatar"
                        >

                        <div class="message-content">

                            <div class="message-header">
                                <span class="username">
                                    ${username}
                                </span>

                                ${botBadge}

                                <span class="handle">
                                    @${tag}
                                </span>

                                <span class="timestamp">
                                    ${formatDate(msg.createdAt)}
                                </span>
                            </div>

                            ${replyHTML}

                            <div class="content">
                                ${
                                    content ||
                                    '<span class="empty">Message sans contenu</span>'
                                }
                            </div>

                            ${attachmentsHTML}
                            ${embedsHTML}

                        </div>
                    </div>
                `;
            }).join('');

            const transcriptHTML = `<!DOCTYPE html>
<html lang="fr">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>
Transcript - #${escapeHTML(message.channel.name)}
</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    background: #313338;
    color: #dbdee1;
    font-family: Arial, Helvetica, sans-serif;
}

.header {
    background: #2b2d31;
    border-bottom: 1px solid #1e1f22;
    padding: 24px 32px;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.channel-icon {
    color: #949ba4;
    font-size: 28px;
    font-weight: bold;
}

.channel-name {
    color: #f2f3f5;
    font-size: 24px;
    font-weight: 700;
}

.channel-info {
    color: #949ba4;
    margin-top: 8px;
    font-size: 14px;
}

.transcript {
    max-width: 1100px;
    margin: auto;
    padding: 30px 20px 60px;
}

.message {
    display: flex;
    gap: 16px;
    padding: 8px 12px;
    border-radius: 6px;
}

.message:hover {
    background: rgba(0, 0, 0, 0.08);
}

.avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.message-content {
    min-width: 0;
    flex: 1;
}

.message-header {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
}

.username {
    color: #f2f3f5;
    font-weight: 600;
    font-size: 16px;
}

.handle {
    color: #949ba4;
    font-size: 13px;
}

.timestamp {
    color: #949ba4;
    font-size: 12px;
}

.bot-badge {
    background: #5865f2;
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 3px;
}

.content {
    margin-top: 3px;
    color: #dbdee1;
    font-size: 15px;
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.content a {
    color: #00a8fc;
}

.empty {
    color: #72767d;
    font-style: italic;
}

.reply {
    display: flex;
    margin: 5px 0;
    color: #949ba4;
}

.reply-line {
    width: 30px;
    height: 16px;
    border-left: 2px solid #4e5058;
    border-top: 2px solid #4e5058;
    margin-right: 7px;
}

.reply-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.reply-text strong {
    color: #b5bac1;
    margin-right: 5px;
}

.attachments {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
}

.attachment-image {
    max-width: 500px;
    max-height: 400px;
    border-radius: 6px;
}

.attachment-file {
    color: #00a8fc;
    text-decoration: none;
}

.attachment-file:hover {
    text-decoration: underline;
}

.embeds {
    margin-top: 8px;
}

.embed {
    max-width: 520px;
    background: #2b2d31;
    border-left: 4px solid #5865f2;
    border-radius: 4px;
    padding: 12px;
}

.embed-title {
    color: #f2f3f5;
    font-weight: 600;
    margin-bottom: 6px;
}

.embed-description {
    line-height: 1.45;
}

.embed-image {
    max-width: 100%;
    max-height: 400px;
    margin-top: 10px;
    border-radius: 4px;
}

.footer {
    text-align: center;
    color: #72767d;
    font-size: 12px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #202225;
}

</style>
</head>

<body>

<div class="header">

    <div class="header-title">
        <span class="channel-icon">#</span>

        <span class="channel-name">
            ${escapeHTML(message.channel.name)}
        </span>
    </div>

    <div class="channel-info">
        ${escapeHTML(message.guild.name)}
        ·
        ${messages.length} message${messages.length > 1 ? 's' : ''}
    </div>

</div>

<div class="transcript">

    ${messageHTML}

    <div class="footer">
        Transcript généré le ${escapeHTML(formatDate(new Date()))}
    </div>

</div>

</body>
</html>`;

            const botFolder = process.cwd();

            const transcriptsFolder = path.join(
                botFolder,
                'transcripts'
            );

            if (!fs.existsSync(transcriptsFolder)) {
                fs.mkdirSync(transcriptsFolder, {
                    recursive: true
                });
            }

            const date = new Date();

            const dateString =
                `${date.getFullYear()}-` +
                `${String(date.getMonth() + 1).padStart(2, '0')}-` +
                `${String(date.getDate()).padStart(2, '0')}`;

            const timeString =
                `${String(date.getHours()).padStart(2, '0')}-` +
                `${String(date.getMinutes()).padStart(2, '0')}-` +
                `${String(date.getSeconds()).padStart(2, '0')}`;

            const channelName = message.channel.name
                .replace(/[^a-zA-Z0-9-_]/g, '-')
                .replace(/-+/g, '-');

            const fileName =
                `transcript-${channelName}-${dateString}-${timeString}.html`;

            const filePath = path.join(
                transcriptsFolder,
                fileName
            );

            fs.writeFileSync(
                filePath,
                transcriptHTML,
                'utf8'
            );

            const attachment = new AttachmentBuilder(
                filePath,
                {
                    name: fileName
                }
            );

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## Transcript généré\nLe transcript de **#${message.channel.name}** a été créé.`
                    )
                )
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `**Messages :** ${messages.length}\n**Fichier :** \`transcripts/${fileName}\`\n**Sauvegarde :** permanente`
                    )
                );

            await loading.edit({
                components: [container],
                files: [attachment],
                flags: MessageFlags.IsComponentsV2
            });

        } catch (error) {
            console.error(error);

            const container = new ContainerBuilder()
                .setAccentColor(3604294)
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        '## Transcript\nUne erreur est survenue lors de la création du transcript.'
                    )
                );

            await loading.edit({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            });
        }
    }
};
