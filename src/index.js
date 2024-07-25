require("dotenv/config");

const { Client, GatewayIntentBits, guildId, EmbedBuilder } = require("discord.js");
const eventHandler = require("./handlers/eventHandler");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.GuildPresences,
  ],
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu()) {
    try {
      if (interaction.customId === "reaction-roles") {
        const selectedRoleId = interaction.values[0];
        const role = interaction.guild.roles.cache.get(selectedRoleId);

        if (!role) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000) // Red color for error
            .setTitle("Error")
            .setDescription("Role not found.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!interaction.guild) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Error")
            .setDescription("This command can only be used in a guild.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (
          !interaction.guild.members.me.permissions.has(
            GatewayIntentBits.ManageRoles
          )
        ) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Permission Error")
            .setDescription("I don't have permission to manage roles.")
            .setTimestamp();
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.member.roles.add(role);

        const successEmbed = new EmbedBuilder()
          .setColor(0x00ae86) // Green color for success
          .setTitle("Role Assigned")
          .setDescription(`Role ${role.name} assigned successfully!`)
          .setTimestamp();

        interaction.reply({ embeds: [successEmbed], ephemeral: true });
      }
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Error")
        .setDescription("There was an error while assigning the role.")
        .setTimestamp();
      interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
});

eventHandler(client);

client.login(process.env.TOKEN);
