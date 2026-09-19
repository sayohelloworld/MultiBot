const {
    PermissionFlagsBits
} = require('discord.js');

const fs = require('fs');
const path = require('path');

const exclusionsPath = path.join(__dirname, '../../utils/roleExclusions.json');

function loadExclusions() {
    try {
        if (!fs.existsSync(exclusionsPath)) {
            fs.writeFileSync(exclusionsPath, JSON.stringify({}, null, 4));
            return {};
        }

        return JSON.parse(fs.readFileSync(exclusionsPath, 'utf8'));
    } catch (error) {
        console.error('Erreur lors du chargement des rôles protégés :', error);
        return {};
    }
}

function saveExclusions(data) {
    try {
        fs.writeFileSync(exclusionsPath, JSON.stringify(data, null, 4));
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des rôles protégés :', error);
    }
}

function getRoleFromArgument(message, argument) {
    if (!argument) return null;

   
    const mentionMatch = argument.match(/^<@&(\d+)>$/);

    if (mentionMatch) {
        return message.guild.roles.cache.get(mentionMatch[1]) || null;
    }

   
    return message.guild.roles.cache.get(argument) || null;
}

module.exports = {
    name: 'delroles',
    description: 'Supprime tous les rôles du serveur avec possibilité d’en protéger certains.',

    async execute(client, message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ Tu n’as pas la permission de gérer les rôles.');
        }

        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ Je n’ai pas la permission de gérer les rôles.');
        }

        const subcommand = args[0]?.toLowerCase();

        const exclusions = loadExclusions();
        const guildId = message.guild.id;

        if (!exclusions[guildId]) {
            exclusions[guildId] = [];
        }

       
        if (subcommand === 'add') {
            const role = getRoleFromArgument(message, args[1]);

            if (!role) {
                return message.reply(
                    '❌ Rôle introuvable.\nUtilisation : `+delroles add @Rôle`'
                );
            }

            if (role.id === message.guild.id) {
                return message.reply('❌ Le rôle @everyone ne peut pas être protégé.');
            }

            if (role.managed) {
                return message.reply(
                    '❌ Ce rôle est géré par une intégration et ne peut pas être supprimé.'
                );
            }

            if (exclusions[guildId].includes(role.id)) {
                return message.reply(
                    `❌ Le rôle **${role.name}** est déjà protégé.`
                );
            }

            exclusions[guildId].push(role.id);
            saveExclusions(exclusions);

            return message.reply(
                `🛡️ Le rôle **${role.name}** est maintenant protégé contre \`+delroles\`.`
            );
        }

       
        if (subcommand === 'remove') {
            const role = getRoleFromArgument(message, args[1]);

            if (!role) {
                return message.reply(
                    '❌ Rôle introuvable.\nUtilisation : `+delroles remove @Rôle`'
                );
            }

            const index = exclusions[guildId].indexOf(role.id);

            if (index === -1) {
                return message.reply(
                    `❌ Le rôle **${role.name}** n’est pas protégé.`
                );
            }

            exclusions[guildId].splice(index, 1);
            saveExclusions(exclusions);

            return message.reply(
                `✅ Le rôle **${role.name}** n’est plus protégé.`
            );
        }

       
        if (subcommand === 'list') {
            const protectedRoles = exclusions[guildId]
                .map(id => message.guild.roles.cache.get(id))
                .filter(role => role);

            if (protectedRoles.length === 0) {
                return message.reply(
                    'ℹ️ Aucun rôle n’est actuellement protégé.'
                );
            }

            const list = protectedRoles
                .map(role => `• ${role} — **${role.name}**`)
                .join('\n');

            return message.reply(
                `🛡️ **Rôles protégés (${protectedRoles.length})**\n\n${list}`
            );
        }

       
        if (subcommand === 'clear') {
            exclusions[guildId] = [];
            saveExclusions(exclusions);

            return message.reply(
                '✅ Toutes les protections de rôles ont été supprimées.'
            );
        }

       
        try {
            const roles = message.guild.roles.cache;

            let deleted = 0;
            let skipped = 0;
            let protectedCount = 0;

            for (const [, role] of roles) {
               
                if (role.id === message.guild.id) {
                    skipped++;
                    continue;
                }

               
                if (role.managed) {
                    skipped++;
                    continue;
                }

               
                if (exclusions[guildId].includes(role.id)) {
                    protectedCount++;
                    continue;
                }

               
                if (role.position >= message.guild.members.me.roles.highest.position) {
                    skipped++;
                    continue;
                }

                try {
                    await role.delete(
                        `Suppression massive des rôles par ${message.author.tag}`
                    );

                    deleted++;
                } catch (error) {
                    console.error(
                        `Erreur lors de la suppression du rôle ${role.name} (${role.id}) :`,
                        error
                    );

                    skipped++;
                }
            }

            return message.reply(
                `🗑️ **${deleted} rôle(s)** supprimé(s).\n` +
                `🛡️ **${protectedCount} rôle(s)** protégé(s).\n` +
                `ℹ️ **${skipped} rôle(s)** ignoré(s).`
            );

        } catch (error) {
            console.error(
                'Erreur lors de la suppression massive des rôles :',
                error
            );

            return message.reply(
                '❌ Une erreur est survenue lors de la suppression des rôles.'
            );
        }
    }
};
