const {
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags
} = require('discord.js');

const guildConfig = require('../../utils/guildConfig');

module.exports = {
    name: 'bareme',
    description: 'Affiche le barème des sanctions',

    async execute(client, message, args) {
        const prefix = guildConfig.get(message.guild.id, 'prefix') || '+';

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## ⚖️ Barème des Sanctions

La modération doit être appliquée de manière cohérente et proportionnelle. Le contexte, la gravité des faits et les antécédents du membre doivent toujours être pris en compte.

> Une sanction doit toujours avoir une raison valable. L'utilisation de ses permissions à des fins personnelles ou pour régler un conflit est interdite.

**Respect & comportement toxique**
*Les comportements irrespectueux ou provocateurs doivent être pris en charge par le staff.*

- Provocation ou manque de respect léger → \`${prefix}warn\`
- Récidive malgré un avertissement → \`${prefix}tempmute\` 15 à 30 minutes
- Insulte directe ou comportement agressif → \`${prefix}tempmute\` 30 minutes
- Propos racistes, homophobes, sexistes ou discriminatoires → \`${prefix}ban\`

**Spam, flood & publicité**
*Le spam et la publicité sont interdits afin de préserver la lisibilité du serveur.*

- Flood léger ou messages répétitifs → \`${prefix}warn\`
- Flood important ou répété → \`${prefix}tempmute\` 10 à 15 minutes
- Publicité ou invitation Discord → \`${prefix}ban\`
- Publicité effectuée sans autorisation → \`${prefix}tempmute\` 30 minutes + \`${prefix}warn\`

**Respect du staff**
*Les décisions de modération doivent être contestées de manière correcte et dans les espaces prévus.*

- Contestation publique d'une sanction → \`${prefix}warn\`
- Provocation ou irrespect envers un staff → \`${prefix}tempmute\` 15 minutes
- Provocations répétées ou acharnement contre l'équipe → \`${prefix}ban\`

**Contenu inapproprié**
*Les contenus sexuels, choquants ou interdits ne sont pas autorisés.*

- NSFW léger ou allusion → Suppression + \`${prefix}warn\`
- NSFW explicite → Suppression + \`${prefix}tempmute\` 1h
- Contenu illégal ou incitation à la haine → \`${prefix}ban\`

**⚠️ Important**
Le barème constitue une base de modération. Une sanction peut être adaptée selon la situation et la gravité des faits.`
                )
            );

        await message.channel.send({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};