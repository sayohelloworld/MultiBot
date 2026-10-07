const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'wanted',

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
        path.join(__dirname, '../../assets/images/wanted.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 430,
        h: 430
      });

      base.composite(avatar, 150, 360);

      const buffer = await base.getBuffer('image/png');

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'wanted.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur génération image.");
    }
  }
};