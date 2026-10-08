const { PermissionFlagsBits } = require('discord.js');
const { sendLog } = require('./logHelper');

async function logSecurity(guild, title, details) {
    try {
        await sendLog(guild, 'security', {
            title,
            details
        });
    } catch {}
}

async function executeAction({ guild, member, userId, action, reason }) {
    if (!guild) return false;

    if (action === 'delete') {
        return true;
    }

    if (action === 'timeout') {
        if (!member?.moderatable) return false;
        try {
            await member.timeout(10 * 60 * 1000, reason);
            return true;
        } catch {
            return false;
        }
    }

    if (action === 'kick') {
        if (!member?.kickable) return false;
        try {
            await member.kick(reason);
            return true;
        } catch {
            return false;
        }
    }

    if (action === 'ban') {
        const id = userId || member?.id;
        if (!id) return false;

        try {
            if (member && !member.bannable) return false;

            await guild.members.ban(id, {
                reason,
                deleteMessageSeconds: 60
            });

            return true;
        } catch {
            return false;
        }
    }

    return false;
}

async function punishMessage(message, action, reason) {
    let deleted = false;

    try {
        await message.delete();
        deleted = true;
    } catch {}

    const member = message.member;

    if (action === 'delete') {
        return deleted;
    }

    const done = await executeAction({
        guild: message.guild,
        member,
        userId: message.author.id,
        action,
        reason
    });

    try {
        await logSecurity(
            message.guild,
            'Security',
            `Membre : ${message.author.tag} (${message.author.id})\n` +
            `Action : ${action}\n` +
            `Raison : ${reason}\n` +
            `Message supprimé : ${deleted ? 'Oui' : 'Non'}`
        );
    } catch {}

    return done;
}

module.exports = {
    executeAction,
    punishMessage,
    logSecurity
};
