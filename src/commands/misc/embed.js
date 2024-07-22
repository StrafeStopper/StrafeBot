const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require('discord.js');
const buttonPagination = require('../../utils/buttonPagination');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Creates an embed message.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  userPermissions: [PermissionFlagsBits.Administrator],
  bot: [],

  run: async (client, interaction) => {
    try {
      const embeds = [];
      for (let i = o; i < 4; i++) {
        embeds.push(new EmbedBuilder().setDescription(`Page ${i + 1}`));
      }

      await buttonPagination(interaction, embeds);
    } catch (err) {
      console.log(err);
    }
  },
};
