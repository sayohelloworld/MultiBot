const { Jimp, loadFont, measureText } = require('jimp');
const path = require('path');

module.exports = {
  name: 'steam-carte',

  async execute(client, message, args) {
    try {
      const user =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0])?.user ||
        message.author;

      const avatarURL = user.displayAvatarURL({
        extension: 'png',
        size: 256
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/steam-carte.png')
      );

      const avatar = await Jimp.read(avatarURL);

      const background = new Jimp({
        width: base.bitmap.width,
        height: base.bitmap.height,
        color: 0xfeb2c1ff
      });

      avatar.resize({
        w: 205,
        h: 205
      });

      background.composite(avatar, 12, 19);
      background.composite(base, 0, 0);

      const font = await loadFont(
        path.join(__dirname, '../../assets/fonts/Noto-Regular.fnt')
      );

      const textWidth = measureText(font, user.username);

      background.print({
        font,
        x: 16,
        y: 11,
        text: user.username,
        maxWidth: background.bitmap.width - 16
      });

      const buffer = await background.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'steam-carte.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};