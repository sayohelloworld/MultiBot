const {
    AuditLogEvent,
    ChannelType
} = require('discord.js');

const { getSecurity } = require('../utils/securityConfig');
const { executeAction, logSecurity } = require('../utils/securityActions');

async function getExecutor(guild, type) {
    try {
        const logs = await guild.fetchAuditLogs({
            type,
            limit: 1
        });

        return logs.entries.first()?.executor || null;
    } catch {
        return null;
    }
}

function allowed(module, executorId) {
    return Boolean(
        executorId &&
        module.whitelistUsers?.includes(executorId)
    );
}

module.exports = {
    name: 'auditLogEntryCreate',

    async execute(entry, guild) {
        if (!guild) return;

        const executorId = entry.executor?.id;

        if (entry.action === AuditLogEvent.MemberBanAdd) {
            const module = getSecurity(guild.id).antiban;

            if (!module.enabled || allowed(module, executorId)) return;

            await executeAction({
                guild,
                userId: entry.target?.id,
                action: module.action,
                reason: 'Bannissement non autorisé détecté'
            });

            await logSecurity(
                guild,
                'Anti-Ban',
                `Exécuteur : ${entry.executor?.tag || executorId}\n` +
                `Cible : ${entry.target?.id || 'Inconnue'}\n` +
                `Action : ${module.action}`
            );

            return;
        }

        if (entry.action === AuditLogEvent.MemberKick) {
            const module = getSecurity(guild.id).antikick;

            if (!module.enabled || allowed(module, executorId)) return;

            await executeAction({
                guild,
                userId: entry.target?.id,
                action: module.action,
                reason: 'Expulsion non autorisée détectée'
            });

            await logSecurity(
                guild,
                'Anti-Kick',
                `Exécuteur : ${entry.executor?.tag || executorId}\n` +
                `Cible : ${entry.target?.id || 'Inconnue'}\n` +
                `Action : ${module.action}`
            );

            return;
        }

        if (
            entry.action === AuditLogEvent.ChannelCreate ||
            entry.action === AuditLogEvent.ChannelDelete ||
            entry.action === AuditLogEvent.ChannelUpdate
        ) {
            const module = getSecurity(guild.id).antichannel;

            if (!module.enabled || allowed(module, executorId)) return;

            if (entry.target?.id) {
                const channel = guild.channels.cache.get(entry.target.id);

                if (module.action === 'delete' && channel?.deletable) {
                    try {
                        await channel.delete('Anti-Channel');
                    } catch {}
                }
            }

            await logSecurity(
                guild,
                'Anti-Channel',
                `Modification de salon détectée\n` +
                `Exécuteur : ${entry.executor?.tag || executorId}\n` +
                `Action : ${module.action}`
            );

            return;
        }

        if (
            entry.action === AuditLogEvent.RoleCreate ||
            entry.action === AuditLogEvent.RoleDelete ||
            entry.action === AuditLogEvent.RoleUpdate
        ) {
            const module = getSecurity(guild.id).role;

            if (!module.enabled || allowed(module, executorId)) return;

            const role = guild.roles.cache.get(entry.target?.id);

            if (module.action === 'delete' && role?.deletable) {
                try {
                    await role.delete('Security Role Protection');
                } catch {}
            }

            await logSecurity(
                guild,
                'Role Protection',
                `Modification de rôle détectée\n` +
                `Exécuteur : ${entry.executor?.tag || executorId}\n` +
                `Action : ${module.action}`
            );

            return;
        }

        if (
            entry.action === AuditLogEvent.WebhookCreate ||
            entry.action === AuditLogEvent.WebhookDelete ||
            entry.action === AuditLogEvent.WebhookUpdate
        ) {
            const module = getSecurity(guild.id).webhook;

            if (!module.enabled || allowed(module, executorId)) return;

            await logSecurity(
                guild,
                'Webhook Protection',
                `Modification de webhook détectée\n` +
                `Exécuteur : ${entry.executor?.tag || executorId}\n` +
                `Action : ${module.action}`
            );

            return;
        }

        if (
            entry.action === AuditLogEvent.GuildUpdate
        ) {
            const module = getSecurity(guild.id).update;

            if (!module.enabled || allowed(module, executorId)) return;

            await logSecurity(
                guild,
                'Server Update Protection',
                `Modification du serveur détectée\n` +
                `Exécuteur : ${entry.executor?.tag || executorId}\n` +
                `Action : ${module.action}`
            );
        }
    }
};
