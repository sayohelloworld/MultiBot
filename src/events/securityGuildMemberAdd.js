const { getSecurity, isWhitelisted } = require('../utils/securityConfig');
const { executeAction, logSecurity } = require('../utils/securityActions');

const joins = new Map();

module.exports = {
    name: 'guildMemberAdd',

    async execute(member) {
        const security = getSecurity(member.guild.id);

        const antialt = security.antialt;

        if (
            antialt.enabled &&
            !isWhitelisted({ member, author: member.user }, antialt)
        ) {
            const age = Date.now() - member.user.createdTimestamp;

            if (age < antialt.minAccountAge) {
                const done = await executeAction({
                    guild: member.guild,
                    member,
                    userId: member.id,
                    action: antialt.action,
                    reason: 'Compte trop récent'
                });

                await logSecurity(
                    member.guild,
                    'Anti-Alt',
                    `Membre : ${member.user.tag} (${member.id})\n` +
                    `Action : ${antialt.action}\n` +
                    `Action exécutée : ${done ? 'Oui' : 'Non'}`
                );

                return;
            }
        }

        const antibot = security.antibot;

        if (
            antibot.enabled &&
            member.user.bot &&
            !antibot.whitelistUsers?.includes(member.id)
        ) {
            const done = await executeAction({
                guild: member.guild,
                member,
                userId: member.id,
                action: antibot.action,
                reason: 'Bot non autorisé'
            });

            await logSecurity(
                member.guild,
                'Anti-Bot',
                `Bot : ${member.user.tag} (${member.id})\n` +
                `Action : ${antibot.action}\n` +
                `Action exécutée : ${done ? 'Oui' : 'Non'}`
            );

            return;
        }

        const antijoin = security.antijoin;

        if (
            antijoin.enabled &&
            !member.user.bot &&
            !isWhitelisted({ member, author: member.user }, antijoin)
        ) {
            const key = member.guild.id;
            const now = Date.now();

            let data = joins.get(key) || [];

            data = data.filter(
                timestamp => now - timestamp <= antijoin.interval
            );

            data.push(now);
            joins.set(key, data);

            if (data.length >= antijoin.maxJoins) {
                joins.delete(key);

                const done = await executeAction({
                    guild: member.guild,
                    member,
                    userId: member.id,
                    action: antijoin.action,
                    reason: 'Arrivée massive détectée'
                });

                await logSecurity(
                    member.guild,
                    'Anti-Join',
                    `Arrivées dans la fenêtre : ${data.length}\n` +
                    `Action : ${antijoin.action}\n` +
                    `Action exécutée : ${done ? 'Oui' : 'Non'}`
                );
            }
        }
    }
};
