const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  Client,
} = require("discord.js");
const reactionSchema = require("../../schemas/RR"); // Import the Mongoose schema

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-role")
    .setDescription("Add reaction roles!")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption((option) =>
      option.setName("role").setDescription("role!").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("description of the role!")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("emoji")
        .setDescription("emoji for the role!")
        .setRequired(false)
    )
    .toJSON(),
  deleted: false,

  run: async (client, interaction) => {
    try {
      const guild = interaction.guild;
      const role = interaction.options.getRole("role");
      const description =
        interaction.options.getString("description") || "No description";
      const emoji = interaction.options.getString("emoji") || "";

      if (!guild) {
        return interaction.reply({
          content: "This command can only be used in a guild.",
          ephemeral: true,
        });
      }

      const guildId = guild.id;

      if (
        role.position >= interaction.member.roles.highest.position &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
      ) {
        return interaction.reply({
          content: "Your role is too low to assign this role!",
          ephemeral: true,
        });
      }

      // Query existing data or initialize if it doesn't exist
      let data = await reactionSchema.findOne({ GuildID: guildId });

      if (!data) {
        data = await reactionSchema.create({
          GuildID: guildId,
          Roles: [],
        });
      }

      // Prepare a new role object
      const newRole = {
        roleId: role.id,
        roleName: role.name, // Add roleName to the schema
        roleDescription: description,
        roleEmoji: emoji,
      };

      // Update or add the new role to the data
      const roleIndex = data.Roles.findIndex((x) => x.roleId === role.id);

      if (roleIndex > -1) {
        data.Roles[roleIndex] = newRole;
      } else {
        data.Roles.push(newRole);
      }

      await data.save();

      return interaction.reply({
        content: `Created new role: **${role.name}**`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "An error occurred while processing the command.",
        ephemeral: true,
      });
    }
  },
};
