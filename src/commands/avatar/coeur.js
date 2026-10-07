const { Jimp } = require('jimp');
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

      const avatar = await Jimp.read(avatarURL);

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/coeur.png')
      );

      avatar.scan((x, y, idx) => {
        avatar.bitmap.data[idx] = Math.round(
          avatar.bitmap.data[idx] * 0.65 +
          255 * 0.35
        );

        avatar.bitmap.data[idx + 1] = Math.round(
          avatar.bitmap.data[idx + 1] * 0.65 +
          20 * 0.35
        );

        avatar.bitmap.data[idx + 2] = Math.round(
          avatar.bitmap.data[idx + 2] * 0.65 +
          147 * 0.35
        );
      });

      base.resize({
        w: avatar.bitmap.width,
        h: avatar.bitmap.height
      });

      avatar.composite(base, 0, 0);

      const buffer = await avatar.getBuffer('image/png');

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