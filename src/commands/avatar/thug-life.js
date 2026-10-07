const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'thug-life',

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

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/thug-life.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.scan((x, y, idx) => {
        const r = avatar.bitmap.data[idx];
        const g = avatar.bitmap.data[idx + 1];
        const b = avatar.bitmap.data[idx + 2];

        const gray = r * 0.3 + g * 0.59 + b * 0.11;

        avatar.bitmap.data[idx] = gray;
        avatar.bitmap.data[idx + 1] = gray;
        avatar.bitmap.data[idx + 2] = gray;
      });

      const width = avatar.bitmap.width / 2;
      const ratio = base.bitmap.width / base.bitmap.height;
      const height = Math.round(width / ratio);

      base.resize({
        w: width,
        h: height
      });

      avatar.composite(
        base,
        Math.round((avatar.bitmap.width / 2) - (width / 2)),
        avatar.bitmap.height - height
      );

      const buffer = await avatar.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'thug-life.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};