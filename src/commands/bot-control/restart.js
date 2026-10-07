const { exec } = require('child_process');

module.exports = {
    name: 'restart',
    description: 'Redémarre le bot avec PM2',

    async execute(client, message, args) {
        if (message.author.id !== client.config.ownerId) {
            return message.reply("Vous n'avez pas la permission d'utiliser cette commande.");
        }

        try {
            await message.reply("Redémarrage en cours...");

            exec('pm2 restart 0', (error, stdout, stderr) => {
                if (error) {
                    console.error('Erreur PM2 :', error);
                    return;
                }

                console.log(stdout);

                if (stderr) {
                    console.error(stderr);
                }
            });
        } catch (err) {
            console.error("Erreur lors du redémarrage :", err);
        }
    }
};