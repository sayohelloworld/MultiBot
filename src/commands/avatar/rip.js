const { Jimp, loadFont } = require('jimp');
const path = require('path');

module.exports = {
  name: 'rip',

  async execute(client, message, args) {
    try {
      const member =
        message.mentions.users.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.author;

      const cause = args.slice(1).join(' ') || '';

      const avatarURL = member.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/rip.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 500,
        h: 500
      });

      avatar.greyscale();

      base.composite(avatar, 194, 399);

      const fontBlack = await loadFont(
        path.join(__dirname, '../../assets/fonts/arial.fnt')
      );

      const fontWhite = await loadFont(
        path.join(__dirname, '../../assets/fonts/arial.fnt')
      );

      base.print({
        font: fontBlack,
        x: 188,
        y: 330,
        text: member.username,
        maxWidth: 500,
        maxHeight: 70
      });

      base.print({
        font: fontWhite,
        x: 188,
        y: 292,
        text: 'A la mémoire de',
        maxWidth: 500,
        maxHeight: 50
      });

      if (cause) {
        base.print({
          font: fontWhite,
          x: 188,
          y: 910,
          text: cause,
          maxWidth: 500,
          maxHeight: 50
        });
      }

      const buffer = await base.getBuffer('image/png');

      if (buffer.length > 8 * 1024 * 1024) {
        return message.reply("Image trop lourde.");
      }

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'rip.png'
        }]
      });
    } catch (err) {
      console.error(err);
      message.reply("Erreur génération RIP.");
    }
  }
};