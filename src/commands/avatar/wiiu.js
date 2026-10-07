const { Jimp } = require('jimp');
const path = require('path');

module.exports = {
  name: 'wiiu',

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
        path.join(__dirname, '../../assets/images/WiiU.png')
      );

      const avatar = await Jimp.read(avatarURL);

      avatar.resize({
        w: 682,
        h: 923
      });

      base.composite(avatar, 4, 56);

      const buffer = await base.getBuffer('image/png');

      return message.channel.send({
        files: [{
          attachment: buffer,
          name: 'WiiU.png'
        }]
      });
    } catch (err) {
      console.error(err);
      return message.reply("Erreur génération image.");
    }
  }
};