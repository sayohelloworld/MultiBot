const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'kyon-flingue',

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
        path.join(__dirname, '../../assets/images/kyon-flingue.png')
      );

      const avatar = await Jimp.read(avatarURL);

      const canvasWidth = base.bitmap.width;
      const canvasHeight = base.bitmap.height;

      const ratio = avatar.bitmap.width / avatar.bitmap.height;
      const width = Math.round(canvasHeight * ratio);
      const x = Math.round((canvasWidth / 2) - (width / 2));

      const background = new Jimp({
        width: canvasWidth,
        height: canvasHeight,
        color: 0x000000ff
      });

      avatar.resize({
        w: width,
        h: canvasHeight
      });

      background.composite(avatar, x, 0);
      background.composite(base, 0, 0);

      const buffer = await background.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'kyon-flingue.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};