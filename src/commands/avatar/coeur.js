const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  name: 'coeur',

  async execute(client, message, args) {
    try {
      const user =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0])?.user ||
        message.author;

      const avatarURL = user.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const avatar = await loadImage(avatarURL);
      const base = await loadImage(
        path.join(__dirname, '../../assets/images/coeur.png')
      );

      const canvas = createCanvas(avatar.width, avatar.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(avatar, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 20, 147, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(base, 0, 0, canvas.width, canvas.height);

      const buffer = canvas.toBuffer();

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'coeur.png'
        }]
      });

    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};

