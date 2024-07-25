const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const reactionSchema = require("../../schemas/RR"); // Import the Mongoose schema

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rr-panel")
    .setDescription("Setup the reaction role panel.")
    .addChannelOption((option) =>
      option
        .setName("panel-channel")
        .setDescription("The channel to send the reaction role panel to.")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
  deleted: false,
  
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const { options, guild } = interaction;

      const panelChannel = options.getChannel("panel-channel");

      if (!guild) {
        return await interaction.editReply({
          content: "This command can only be used in a guild.",
        });
      }

      const guildId = guild.id;

      // Query existing data and log it
      let reactionData = await reactionSchema.findOne({
        GuildID: guildId,
      });

      console.log("Reaction Data:", reactionData);

      if (
        !reactionData ||
        !Array.isArray(reactionData.Roles) ||
        reactionData.Roles.length === 0
      ) {
        return await interaction.editReply({
          content: "No reaction roles are set up for this server.",
        });
      }

      // Continue with processing the reaction role data
      const roleOptions = reactionData.Roles.reduce((options, roleData) => {
        if (roleData.roleId && roleData.roleName) {
          options.push({
            label: roleData.roleName,
            value: String(roleData.roleId),
            description: roleData.roleDescription || "No description",
            emoji: roleData.roleEmoji || undefined,
          });
        }
        return options;
      }, []);

      if (roleOptions.length === 0) {
        return await interaction.editReply({
          content: "The reaction roles data is incomplete or invalid.",
        });
      }

      const menuComponents = [
        new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("reaction-roles")
            .addOptions(roleOptions)
        ),
      ];

      const panelEmbed = new EmbedBuilder()
        .setTitle("Reaction Roles")
        .setDescription("Select a role from the menu below.")
        .setColor(0xffffff);

      await panelChannel.send({
        embeds: [panelEmbed],
        components: menuComponents,
      });
      return await interaction.editReply({
        content: `The reaction role panel has been sent to ${panelChannel}.`,
      });
    } catch (err) {
      console.error(err);
      return interaction.editReply({
        content: "An error occurred while setting up the reaction role panel.",
        ephemeral: true,
      });
    }
  },
};
