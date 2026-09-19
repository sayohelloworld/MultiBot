const {
    AuditLogEvent,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
} = require('discord.js');
const { sendLog } = require('../utils/logHelper');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        if (newMember.user?.bot) return;
        const guild = newMember.guild;

       
        const wasBosting = !!oldMember.premiumSince;
        const isBoosting = !!newMember.premiumSince;
        if (!wasBosting && isBoosting) {
            const container = new ContainerBuilder().setAccentColor(0xFF73FA);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🚀 Nouveau Boost !')
            );
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            const section = new SectionBuilder();
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `${newMember} a commencé à **booster** le serveur ! 🎉\n\n` +
                    `**🚀 Boosts total :** ${guild.premiumSubscriptionCount || 0}`
                )
            );
            section.setThumbnailAccessory(
                new ThumbnailBuilder().setURL(newMember.user.displayAvatarURL({ dynamic: true }))
            );
            container.addSectionComponents(section);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`)
            );
            await sendLog(guild, 'boost', container);
        } else if (wasBosting && !isBoosting) {
            const container = new ContainerBuilder().setAccentColor(0x808080);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 💔 Fin de Boost')
            );
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            const section = new SectionBuilder();
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`${newMember} a **arrêté de booster** le serveur.`)
            );
            section.setThumbnailAccessory(
                new ThumbnailBuilder().setURL(newMember.user.displayAvatarURL({ dynamic: true }))
            );
            container.addSectionComponents(section);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`)
            );
            await sendLog(guild, 'boost', container);
        }

       
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;
        const added = newRoles.filter(r => !oldRoles.has(r.id));
        const removed = oldRoles.filter(r => !newRoles.has(r.id));

        if (added.size === 0 && removed.size === 0) return;

        let executor = null;
        try {
            await new Promise(r => setTimeout(r, 600));
            const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 1 });
            const entry = logs.entries.first();
            if (entry && entry.target?.id === newMember.id && Date.now() - entry.createdTimestamp < 5000) {
                executor = entry.executor;
            }
        } catch {}

        if (added.size > 0) {
            const container = new ContainerBuilder().setAccentColor(0x57F287);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🎖️ Rôle(s) Ajouté(s)')
            );
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            const section = new SectionBuilder();
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**👤 Membre :** ${newMember.user.tag} \`${newMember.id}\`\n` +
                    `**➕ Rôle(s) ajouté(s) :** ${added.map(r => `<@&${r.id}>`).join(', ')}\n` +
                    `**🛠️ Par :** ${executor ? executor.tag : 'Inconnu'}`
                )
            );
            section.setThumbnailAccessory(
                new ThumbnailBuilder().setURL(newMember.user.displayAvatarURL({ dynamic: true }))
            );
            container.addSectionComponents(section);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`)
            );
            await sendLog(guild, 'roles', container);
        }

        if (removed.size > 0) {
            const container = new ContainerBuilder().setAccentColor(0xED4245);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent('## 🎖️ Rôle(s) Retiré(s)')
            );
            container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            const section = new SectionBuilder();
            section.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**👤 Membre :** ${newMember.user.tag} \`${newMember.id}\`\n` +
                    `**➖ Rôle(s) retiré(s) :** ${removed.map(r => `<@&${r.id}>`).join(', ')}\n` +
                    `**🛠️ Par :** ${executor ? executor.tag : 'Inconnu'}`
                )
            );
            section.setThumbnailAccessory(
                new ThumbnailBuilder().setURL(newMember.user.displayAvatarURL({ dynamic: true }))
            );
            container.addSectionComponents(section);
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# <t:${Math.floor(Date.now() / 1000)}:F>`)
            );
            await sendLog(guild, 'roles', container);
        }
    }
};
