const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'sora-selfie',

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
        path.join(__dirname, '../../assets/images/sora-selfie.png')
      );

      const avatar = await Jimp.read(avatarURL);

      const ratio = avatar.bitmap.width / avatar.bitmap.height;
      const width = Math.round(base.bitmap.height * ratio);

      const background = new Jimp({
        width: base.bitmap.width,
        height: base.bitmap.height,
        color: 0x000000ff
      });

      avatar.resize({
        w: width,
        h: base.bitmap.height
      });

      background.composite(
        avatar,
        Math.round((background.bitmap.width / 2) - (width / 2)),
        0
      );

      background.composite(base, 0, 0);

      const buffer = await background.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'sora-selfie.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};