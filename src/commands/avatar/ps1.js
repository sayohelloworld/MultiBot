const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'ps1',

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
        path.join(__dirname, '../../assets/images/ps1.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 639,
        h: 547
      });

      avatar.scan(70, 399, 500, 500, (x, y, idx) => {
        const avg =
          (avatar.bitmap.data[idx] +
            avatar.bitmap.data[idx + 1] +
            avatar.bitmap.data[idx + 2]) /
          3;

        avatar.bitmap.data[idx] = avg;
        avatar.bitmap.data[idx + 1] = avg;
        avatar.bitmap.data[idx + 2] = avg;
      });

      base.composite(avatar, 0, 0);

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'ps1.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};