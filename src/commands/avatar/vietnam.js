const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'vietnam',

  async execute(client, message, args) {
    try {
      const member =
        message.mentions.members.first() ||
        message.guild.members.cache.get(args[0]) ||
        message.member;

      const avatarURL = member.user.displayAvatarURL({
        extension: 'png',
        size: 512
      });

      const base = await Jimp.read(
        path.join(__dirname, '../../assets/images/vietnam.png')
      );

      const avatar = await Jimp.read(avatarURL);

      const ratio = base.bitmap.width / base.bitmap.height;
      const width = Math.round(avatar.bitmap.height * ratio);

      base.resize({
        w: width,
        h: base.bitmap.height
      });

      const background = new Jimp({
        width: base.bitmap.width,
        height: base.bitmap.height,
        color: 0x00000000
      });

      background.composite(
        base,
        Math.round((background.bitmap.width / 2) - (width / 2)),
        0
      );

      avatar.resize({
        w: background.bitmap.width,
        h: background.bitmap.height
      });

      avatar.opacity(0.675);

      background.composite(avatar, 0, 0);

      const buffer = await background.getBuffer('image/png');

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'vietnam.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur génération image.");
    }
  }
};