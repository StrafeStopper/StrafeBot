const {
    SlashCommandBuilder,
    PermissionFlagsBits,
  } = require("discord.js");
  const reactionSchema = require("../../schemas/RR"); // Import the Mongoose schema
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("remove-role")
      .setDescription("Remove reaction roles!")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addRoleOption((option) =>
        option.setName("role").setDescription("Select a role to remove.").setRequired(true)
      ),
  
    run: async (client, interaction) => {
      try {
        const guild = interaction.guild;
        const role = interaction.options.getRole("role");
  
        if (!guild) {
          return interaction.reply({
            content: "This command can only be used in a guild.",
            ephemeral: true,
          });
        }
  
        const guildId = guild.id;
  
     
        let data = await reactionSchema.findOne({ GuildID: guildId });
  
        if (!data) {
          return interaction.reply({
            content: "No reaction roles found for this server.",
            ephemeral: true,
          });
        }
 
        const roleIndex = data.Roles.findIndex((x) => x.roleId === role.id);
  
        if (roleIndex > -1) {
          data.Roles.splice(roleIndex, 1);
        } else {
          return interaction.reply({
            content: `Role not found among reaction roles.`,
            ephemeral: true,
          });
        }
  
        await data.save();
  
        return interaction.reply({
          content: `Removed role: **${role.name}** from reaction roles.`,
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