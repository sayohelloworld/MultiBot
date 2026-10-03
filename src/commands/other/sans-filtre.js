const {
    ContainerBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

module.exports = {
    name: "sans-filtre",
    description: "Affiche les informations et le bouton d'accès au tchat sans filtre.",

    async execute(client, message, args) {

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
`# <a:cat:1548633716677677066> Chat sans filtre

Le « Chat sans filtre » ne signifie pas que ce salon est sans règles ou qu'il est autorisé aux contenus NSFW ❌

<:Fille_coeur:1528327940847435857> Ce salon reste entièrement **SFW**, mais l'AutoMod n'y applique pas sa censure automatique.

Cela ne signifie pas que tout est permis. Merci de rester respectueux et raisonnable.

Seront notamment sanctionnés :
<a:Fleche:1548633551933677639> Les discriminations
<a:Fleche:1548633551933677639> Le harcèlement
<a:Fleche:1548633551933677639> Les contenus sexuels
<a:Fleche:1548633551933677639> Les comportements déplacés
<a:Fleche:1548633551933677639> Les propos ou contenus contraires au règlement du serveur

<a:links:1528188449579077792> L'accès à ce salon est réservé aux membres ayant obtenu le rôle **Sans filtre**.

<a:oui:1548382539058520064> En cliquant sur le bouton ci-dessous, tu demandes l'accès au tchat et le rôle nécessaire te sera automatiquement attribué.

Ces règles restent applicables conformément aux **Conditions d'utilisation et aux règles de Discord**. <a:dis_loading:1548382562261405696>`
                    )
            )
            .addActionRowComponents(
                new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId("sans_filtre_access")
                            .setLabel("Accéder au chat sans filtre")
                            .setStyle(ButtonStyle.Primary)
                    )
            );

        return message.channel.send({
            flags: MessageFlags.IsComponentsV2,
            components: [container]
        });
    }
};