const { getSecurity } = require('../utils/securityConfig');
const { executeAction, logSecurity } = require('../utils/securityActions');

module.exports = {
    name: 'guildMemberAdd',

    async execute(member) {
        const module = getSecurity(member.guild.id).blacklist;

        if (!module.enabled) return;

        const blacklisted =
            module.users.includes(member.id) ||
            member.roles.cache.some(role => module.roles.includes(role.id));

        if (!blacklisted) return;

        const done = await executeAction({
            guild: member.guild,
            member,
            userId: member.id,
            action: 'ban',
            reason: 'Membre blacklisté'
        });

        await logSecurity(
            member.guild,
            'Blacklist',
            `Membre : ${member.user.tag} (${member.id})\n` +
            `Action : ban\n` +
            `Action exécutée : ${done ? 'Oui' : 'Non'}`
        );
    }
};
