const { Jimp, loadFont, measureText } = require('jimp');
const path = require('path');

module.exports = {
  name: 'd-profil',

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
        path.join(__dirname, '../../assets/images/d-profil.png')
      );

      avatar.resize({
        w: 92,
        h: 92
      });

      base.composite(avatar, 20, 20);

      const font = await loadFont(
        path.join(__dirname, '../../assets/fonts/arial.fnt')
      );

      const text = user.tag;
      const textWidth = measureText(font, text);

      base.print({
        font,
        x: 190 - textWidth / 2,
        y: 40,
        text,
        maxWidth: 305
      });

      const cause = args.slice(1).join(' ');

      if (cause) {
        const causeWidth = measureText(font, cause);

        base.print({
          font,
          x: 438 - causeWidth / 2,
          y: 910,
          text: cause,
          maxWidth: 500
        });
      }

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      await message.channel.send({
        files: [{
          attachment: buffer,
          name: 'd-profil.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur lors de la génération de l'image.");
    }
  }
};