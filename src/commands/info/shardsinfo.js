const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags
} = require('discord.js');

module.exports = {
    name: 'shardsinfo',
    description: 'Affiche les informations et statistiques des shards du bot.',

    async execute(client, message, args) {
        await message.channel.sendTyping();

        const formatUptime = (ms) => {
            const seconds = Math.floor(ms / 1000);

            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;

            const parts = [];

            if (days > 0) parts.push(`${days}j`);
            if (hours > 0 || days > 0) parts.push(`${hours}h`);
            if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
            parts.push(`${secs}s`);

            return parts.join(' ');
        };

        const formatMemory = (bytes) => {
            return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} Go`;
        };

        const formatNumber = (number) => {
            return number.toLocaleString('fr-FR');
        };

        const os = require('os');

        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;

        const processMemory = process.memoryUsage().rss;

        const guilds = client.guilds?.cache?.size || 0;

        const users = client.guilds?.cache?.reduce(
            (total, guild) => total + (guild.memberCount || 0),
            0
        ) || 0;

        const shardCount = client.ws?.shards?.size || 1;

        const uptime = client.uptime || 0;

        const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `# 📡 Informations des shards\n\n` +
                    `## 🤖 Statistiques globales\n\n` +
                    `**Shards :** ${formatNumber(shardCount)}\n` +
                    `**Serveurs :** ${formatNumber(guilds)}\n` +
                    `**Utilisateurs :** ${formatNumber(users)}\n` +
                    `**Uptime :** ${formatUptime(uptime)}`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 📡 Connexion\n\n` +
                    `**Ping du bot :** ${client.ws.ping}ms\n` +
                    `**Ping API Discord :** ${client.ws.ping}ms`
                )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## 💾 RAM du host\n\n` +
                    `**RAM utilisée :** ${formatMemory(usedMemory)}\n` +
                    `**RAM totale :** ${formatMemory(totalMemory)}\n` +
                    `**RAM disponible :** ${formatMemory(freeMemory)}\n` +
                    `**RAM du processus :** ${(processMemory / 1024 / 1024).toFixed(2)} MB`
                )
            );

        const shardEntries = [];

        if (client.ws?.shards) {
            for (const [shardId, shard] of client.ws.shards) {
                const ping = shard.ping;

                shardEntries.push(
                    `### 🛰️ Shard ${shardId}\n` +
                    `**Ping :** ${ping >= 0 ? `${ping}ms` : 'N/A'}`
                );
            }
        }

        if (shardEntries.length > 0) {
            container
                .addSeparatorComponents(
                    new SeparatorBuilder()
                )
                .addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `## 🛰️ Détails des shards\n\n` +
                        shardEntries.join('\n\n')
                    )
                );
        }

        await message.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
