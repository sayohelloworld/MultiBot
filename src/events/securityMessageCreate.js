const {
    getSecurity,
    isWhitelisted
} = require('../utils/securityConfig');

const { punishMessage } = require('../utils/securityActions');

const spamCache = new Map();

const INVITE_REGEX =
    /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:gg|com\/invite)\/[a-zA-Z0-9-]+)/i;

const URL_REGEX =
    /(?:https?:\/\/|www\.)[^\s<>"`]+/i;

function checkSpam(message, module) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();

    let data = spamCache.get(key);

    if (!data) {
        data = {
            messages: [],
            lastContent: null,
            duplicates: 0
        };

        spamCache.set(key, data);
    }

    data.messages = data.messages.filter(
        timestamp => now - timestamp <= module.interval
    );

    data.messages.push(now);

    const content = message.content.toLowerCase();

    if (data.lastContent === content) {
        data.duplicates++;
    } else {
        data.lastContent = content;
        data.duplicates = 1;
    }

    if (
        data.messages.length >= module.maxMessages ||
        data.duplicates >= module.duplicateLimit
    ) {
        spamCache.delete(key);
        return true;
    }

    return false;
}

module.exports = {
    name: 'messageCreate',

    async execute(message) {
        if (!message.guild) return;
        if (message.author?.bot) return;
        if (!message.member) return;

        const content = message.content?.trim();
        if (!content) return;

        const security = getSecurity(message.guild.id);

        const badword = security.antibadword;

        if (
            badword.enabled &&
            !isWhitelisted(message, badword)
        ) {
            const found = badword.words.find(word =>
                content.toLowerCase().includes(word.toLowerCase())
            );

            if (found) {
                await punishMessage(
                    message,
                    badword.action,
                    `Anti-badword : ${found}`
                );
                return;
            }
        }

        const serverlink = security.serverlink;

        if (
            serverlink.enabled &&
            !isWhitelisted(message, serverlink) &&
            INVITE_REGEX.test(content)
        ) {
            await punishMessage(
                message,
                serverlink.action,
                'Lien vers un serveur Discord détecté'
            );
            return;
        }

        const antilink = security.antilink;

        if (
            antilink.enabled &&
            !isWhitelisted(message, antilink) &&
            URL_REGEX.test(content)
        ) {
            await punishMessage(
                message,
                antilink.action,
                'Lien détecté'
            );
            return;
        }

        const mentions = security.antimassmention;

        if (
            mentions.enabled &&
            !isWhitelisted(message, mentions)
        ) {
            const users = message.mentions.users.size;
            const roles = message.mentions.roles.size;
            const total = users + roles;

            if (
                users >= mentions.maxUsers ||
                roles >= mentions.maxRoles ||
                total >= mentions.maxTotal ||
                message.mentions.everyone
            ) {
                await punishMessage(
                    message,
                    mentions.action,
                    'Mention massive détectée'
                );
                return;
            }
        }

        const spam = security.spam;

        if (
            spam.enabled &&
            !isWhitelisted(message, spam) &&
            checkSpam(message, spam)
        ) {
            await punishMessage(
                message,
                spam.action,
                'Spam détecté'
            );
        }
    }
};
