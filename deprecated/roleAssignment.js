const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChannelSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Integration,
  Component,
  Guild,
} = require("discord.js");
const roleSchema = require("./roles");
const mConfig = require("../src/messageConfig.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleassignment")
    .setDescription("Assign roles to users from reactions.")
    .addSubcommand((s) =>
      s
        .setName("configure")
        .setDescription("Configures the role assignment system.")
        .addStringOption((opt) =>
            opt
              .setName("amount")
              .setDescription("The amount of role reactions in the join message.")
              .setChoices(
                { name: "1", value: '1' },
                { name: "2", value: '2' },
                { name: "3", value: '3' },
                { name: "4", value: '4' },
                { name: "5", value: '5' },
                { name: "6", value: '6' }
              )
              .setRequired(true)
          )
    )
    .addSubcommand((s) =>
      s.setName("remove").setDescription("Removes the role assignment system.")
    )
    .toJSON(),
  deleted: true,

  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],

  run: async (client, interaction) => {
    const { options, guildId, channel, guild } = interaction;
    const subcmd = options.getSubcommand();
    if (!["configure", "remove"].includes(subcmd)) return;

    const rEmbed = new EmbedBuilder().setFooter({
      iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
      text: `${client.user.username} - Role assignment system`,
    });

    switch (subcmd) {
        case "configure":
            let data = await loggingSchema.findOne({ GuildID: guildId });
            let response;
            const amount = interaction.options.getString("amount");

            if (!data) {
                rEmbed
                  .setColor(mConfig.embedColorWarning)
                  .setDescription(
                    "New server detetected: Configuring the role assignment system ..."
                  );
                response = await interaction.reply({
                  embeds: [rEmbed],
                  fetchReply: true,
                  ephemeral: true,
                });
      
                dataGD = new roleSchema({
                  GuildID: guildId,
                  Webhooks: [],
                });
                data.save();
              } else {
                response = await interaction.deferReply({
                  fetchReply: true,
                  ephemeral: true,
                });
              }
            break;

        case "remove":
            break;
    }
  }
};
