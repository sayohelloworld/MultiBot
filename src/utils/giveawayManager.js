const fs = require('fs');
const path = require('path');
const {
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require('discord.js');

const GIVEAWAYS_FILE = path.join(__dirname, '../../data/giveaways.json');

function load() {
    if (!fs.existsSync(GIVEAWAYS_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(GIVEAWAYS_FILE, 'utf8')); } catch { return {}; }
}
function save(data) { fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify(data, null, 2)); }

function get(messageId) { return load()[messageId] || null; }
function getAll() { return load(); }
function getByGuild(guildId) { return Object.values(load()).filter(g => g.guildId === guildId); }
function getActiveByGuild(guildId) { return getByGuild(guildId).filter(g => !g.ended); }

function create(data) {
    const all = load();
    all[data.messageId] = data;
    save(all);
}
function update(messageId, fields) {
    const all = load();
    if (!all[messageId]) return;
    Object.assign(all[messageId], fields);
    save(all);
}
function remove(messageId) {
    const all = load();
    delete all[messageId];
    save(all);
}

const drafts = new Map();

function getDraftKey(guildId, userId) { return `${guildId}:${userId}`; }
function getDraft(guildId, userId) { return drafts.get(getDraftKey(guildId, userId)) || null; }
function setDraft(guildId, userId, data) { drafts.set(getDraftKey(guildId, userId), data); }
function deleteDraft(guildId, userId) { drafts.delete(getDraftKey(guildId, userId)); }

function createDraft(guildId, userId, gcfg) {
    const draft = {
        guildId,
        hostId: userId,
        prize: null,
        duration: null,
        durationStr: null,
        winners: gcfg?.defaultWinners || 1,
        description: null,
        color: gcfg?.defaultColor || '#F1C40F',
        image: null,
        thumbnail: null,
        notifRole: null,
        notifStr: null,
        requiredRoleId: null,
        channelId: gcfg?.defaultChannelId || null,
        wizardMessageId: null,
        wizardChannelId: null
    };
    setDraft(guildId, userId, draft);
    return draft;
}

function parseDuration(str) {
    if (!str) return null;
    str = str.trim().toLowerCase();
    const units = {
        s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
        m: 60000, min: 60000, mins: 60000, minute: 60000, minutes: 60000,
        h: 3600000, hr: 3600000, heure: 3600000, heures: 3600000, hour: 3600000, hours: 3600000,
        d: 86400000, day: 86400000, days: 86400000, jour: 86400000, jours: 86400000, j: 86400000,
        w: 604800000, week: 604800000, weeks: 604800000, semaine: 604800000, semaines: 604800000
    };
    const regex = /(\d+)\s*([a-zA-Zé]+)/g;
    let total = 0;
    let match;
    while ((match = regex.exec(str)) !== null) {
        const unit = match[2].toLowerCase();
        if (units[unit]) total += parseInt(match[1]) * units[unit];
    }
    return total > 0 ? total : null;
}

function formatDuration(ms) {
    const parts = [];
    const d = Math.floor(ms / 86400000); if (d) parts.push(`${d}j`);
    const h = Math.floor((ms % 86400000) / 3600000); if (h) parts.push(`${h}h`);
    const m = Math.floor((ms % 3600000) / 60000); if (m) parts.push(`${m}m`);
    const s = Math.floor((ms % 60000) / 1000); if (s && !d) parts.push(`${s}s`);
    return parts.join(' ') || '0s';
}

function hexToInt(hex) {
    if (!hex) return 0xF1C40F;
    return parseInt(hex.replace('#', ''), 16);
}

function buildGiveawayEmbed(giveaway) {
    const lines = [];
    if (giveaway.description) lines.push(`> ${giveaway.description}\n`);
    lines.push(`🏆 **Gagnant(s) :** ${giveaway.winners}`);
    lines.push(`⏱️ **Se termine :** <t:${Math.floor(giveaway.endTime / 1000)}:R>`);
    lines.push(`🎟️ **Participants :** **${giveaway.entries.length}**`);
    lines.push(`👤 **Organisé par :** <@${giveaway.hostId}>`);
    if (giveaway.requiredRoleId) lines.push(`🔒 **Condition :** <@&${giveaway.requiredRoleId}>`);
    if (giveaway.notifRole) {
        const n = giveaway.notifRole === 'everyone' ? '@everyone' :
                  giveaway.notifRole === 'here' ? '@here' : `<@&${giveaway.notifRole}>`;
        lines.push(`🔔 **Notification :** ${n}`);
    }

    const container = new ContainerBuilder().setAccentColor(hexToInt(giveaway.color));
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## 🎉 ${giveaway.prize}`)
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));

    if (giveaway.thumbnail) {
        const section = new SectionBuilder();
        section.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
        section.setThumbnailAccessory(new ThumbnailBuilder().setURL(giveaway.thumbnail));
        container.addSectionComponents(section);
    } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(lines.join('\n')));
    }

    if (giveaway.image) {
        container.addMediaGalleryComponents(
            new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(giveaway.image))
        );
    }

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`-# Se termine le <t:${Math.floor(giveaway.endTime / 1000)}:F>`)
    );
    return container;
}

function buildEntryRow(giveaway, disabled = false) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('gw_enter')
            .setLabel(`🎉 Participer — ${giveaway.entries.length}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || giveaway.ended)
    );
}

function buildWizardEmbed(draft) {
    const val = (v, fallback = '*Non défini*') => v != null ? String(v) : fallback;
    const check = (v) => v ? '✅' : '⬜';

    const container = new ContainerBuilder().setAccentColor(hexToInt(draft.color));
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## 🎉 Création d\'un Giveaway')
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            'Configurez votre giveaway via les boutons ci-dessous.\n`✅` = défini · `⬜` = optionnel · `❌` = manquant obligatoire'
        )
    );
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `**🏆 Prix ${draft.prize ? '✅' : '❌'}** — ${val(draft.prize)}\n` +
            `**⏱️ Durée ${draft.durationStr ? '✅' : '❌'}** — ${val(draft.durationStr)}\n` +
            `**👥 Gagnants ✅** — ${draft.winners}\n` +
            `**📝 Description ${check(draft.description)}** — ${val(draft.description, '*Aucune*')}\n` +
            `**🎨 Couleur ✅** — \`${draft.color}\`\n` +
            `**🖼️ Image ${check(draft.image)}** — ${draft.image ? '✅ Définie' : '*Aucune*'}\n` +
            `**🔔 Notification ${check(draft.notifStr)}** — ${val(draft.notifStr, '*Aucune*')}\n` +
            `**🔒 Condition ${check(draft.requiredRoleId)}** — ${draft.requiredRoleId ? `<@&${draft.requiredRoleId}>` : '*Aucune*'}\n` +
            `**📡 Salon ${check(draft.channelId)}** — ${draft.channelId ? `<#${draft.channelId}>` : '*Salon actuel*'}`
        )
    );
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('-# ⚠️ Prix et durée sont obligatoires pour lancer le giveaway.')
    );
    return container;
}

function buildWizardRows(draft) {
    const s = (v) => v ? ButtonStyle.Success : ButtonStyle.Secondary;
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gw_set_prize').setLabel('🏆 Prix').setStyle(s(draft.prize)),
        new ButtonBuilder().setCustomId('gw_set_duration').setLabel('⏱️ Durée').setStyle(s(draft.durationStr)),
        new ButtonBuilder().setCustomId('gw_set_winners').setLabel('👥 Gagnants').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('gw_set_description').setLabel('📝 Description').setStyle(s(draft.description)),
        new ButtonBuilder().setCustomId('gw_set_condition').setLabel('🔒 Condition').setStyle(s(draft.requiredRoleId))
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gw_set_color').setLabel('🎨 Couleur').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('gw_set_image').setLabel('🖼️ Image').setStyle(s(draft.image)),
        new ButtonBuilder().setCustomId('gw_set_notif').setLabel('🔔 Notification').setStyle(s(draft.notifRole)),
        new ButtonBuilder().setCustomId('gw_set_channel').setLabel('📡 Salon').setStyle(s(draft.channelId))
    );
    const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('gw_launch').setLabel('🚀 Lancer le Giveaway').setStyle(ButtonStyle.Primary)
            .setDisabled(!draft.prize || !draft.durationStr),
        new ButtonBuilder().setCustomId('gw_cancel').setLabel('✖ Annuler').setStyle(ButtonStyle.Danger)
    );
    return [row1, row2, row3];
}

async function endGiveaway(giveaway, client) {
    try {
        const guild = client.guilds.cache.get(giveaway.guildId);
        if (!guild) { update(giveaway.messageId, { ended: true }); return; }
        const channel = guild.channels.cache.get(giveaway.channelId);
        if (!channel) { update(giveaway.messageId, { ended: true }); return; }

        const msg = await channel.messages.fetch(giveaway.messageId).catch(() => null);

        let eligible = [...giveaway.entries];
        if (giveaway.requiredRoleId) {
            await guild.members.fetch().catch(() => {});
            eligible = eligible.filter(uid => {
                const m = guild.members.cache.get(uid);
                return m && m.roles.cache.has(giveaway.requiredRoleId);
            });
        }
        const winners = eligible.sort(() => Math.random() - 0.5).slice(0, giveaway.winners);
        update(giveaway.messageId, { ended: true, winnerIds: winners });

        if (msg) {
            const endContainer = new ContainerBuilder().setAccentColor(0x95A5A6);
            endContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## 🎉 ${giveaway.prize} — Terminé !`)
            );
            endContainer.addSeparatorComponents(new SeparatorBuilder().setSpacing(1).setDivider(true));
            endContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    (winners.length > 0
                        ? `🏆 **Gagnant(s) :** ${winners.map(id => `<@${id}>`).join(', ')}\n\n`
                        : `❌ **Aucun gagnant** (pas de participants valides)\n\n`) +
                    `🎟️ **Participants :** ${giveaway.entries.length}\n` +
                    `👤 **Organisé par :** <@${giveaway.hostId}>`
                )
            );
            if (giveaway.image) {
                endContainer.addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(giveaway.image))
                );
            }
            endContainer.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`-# Giveaway terminé`)
            );
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('gw_enter')
                    .setLabel(`🎉 Terminé — ${giveaway.entries.length} participants`)
                    .setStyle(ButtonStyle.Secondary).setDisabled(true)
            );
            await msg.edit({ components: [endContainer, row], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        if (winners.length > 0) {
            await channel.send({
                content: `🎉 Félicitations ${winners.map(id => `<@${id}>`).join(', ')} ! Vous remportez **${giveaway.prize}** !\n> Organisé par <@${giveaway.hostId}>`,
                allowedMentions: { users: winners }
            }).catch(() => {});
        } else {
            await channel.send({ content: `❌ Le giveaway **${giveaway.prize}** s'est terminé sans gagnant.` }).catch(() => {});
        }
    } catch (err) {
        console.error('[GW] Erreur endGiveaway:', err.message);
        update(giveaway.messageId, { ended: true });
    }
}

let timerStarted = false;
function startTimer(client) {
    if (timerStarted) return;
    timerStarted = true;
    setInterval(async () => {
        const now = Date.now();
        for (const gw of Object.values(load())) {
            if (!gw.ended && gw.endTime <= now) {
                await endGiveaway(gw, client);
            }
        }
    }, 10000);
}

module.exports = {
    get, getAll, getByGuild, getActiveByGuild, create, update, remove,
    getDraft, setDraft, deleteDraft, createDraft,
    parseDuration, formatDuration,
    buildGiveawayEmbed, buildEntryRow, buildWizardEmbed, buildWizardRows,
    endGiveaway, startTimer
};
