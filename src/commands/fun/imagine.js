const {
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const models = require("../../models");
require("dotenv/config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("image-ai")
    .setDescription("Generate an AI image using a prompt.")
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("Enter your prompt")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("model")
        .setDescription("The image model to use")
        .setChoices(models)
        .setRequired(true)
    )
    .toJSON(),
  deleted: false,

  userPermissions: [PermissionFlagsBits.SendMessages],
  botPermissions: [PermissionFlagsBits.SendMessages],

  run: async ( client, interaction ) => {
    await interaction.deferReply();
    try {
      const { default: Replicate } = await import("replicate");

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_KEY,
      });

      const prompt = interaction.options.getString("prompt");
      const model = interaction.options.getString("model") || models[0].value;

      const output = await replicate.run(model, { input: { prompt } });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(`Download`)
          .setStyle(ButtonStyle.Link)
          .setURL(`${output[0]}`)
          .setEmoji("1101133529607327764")
      );

      const resultEmbed = new EmbedBuilder()
        .setTitle("Image Generated")
        .addFields({ name: "Prompt", value: prompt })
        .setImage(output[0])
        .setColor("#44a3e3")
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      await interaction.editReply({
        embeds: [resultEmbed],
        components: [row],
      });
    } catch (error) {
      console.log(`An error occured:\n\n ${error}`);
      /*const errEmbed = new EmbedBuilder()
        .setTitle("An error occurred")
        .setDescription("```" + error + "```")
        .setColor(0xe32424);

      return  interaction.editReply({ embeds: [errEmbed] });*/
    }
  },
};
