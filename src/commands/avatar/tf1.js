const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'tf1',

  async execute(client, message, args) {
    try {
      const user =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0])?.user ||
        message.author;

      const cause = args.slice(1).join(' ');

      const avatarURL = user.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/tf1.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 122,
        h: 122
      });

      base.composite(avatar, 254, 13);

      const font = await require('jimp').loadFont(
        path.join(__dirname, '../../assets/fonts/arial.fnt')
      );

      const username = user.tag;

      base.print({
        font,
        x: 0,
        y: 166,
        text: username,
        maxWidth: 460,
        maxHeight: 20
      });

      if (cause) {
        base.print({
          font,
          x: 0,
          y: 190,
          text: cause,
          maxWidth: 460,
          maxHeight: 20
        });
      }

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("L'image dépasse 8 Mo.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'tf1.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur lors de la génération de l'image.");
    }
  }
};