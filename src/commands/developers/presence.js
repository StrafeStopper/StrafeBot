
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActivityType,
  EmbedBuilder,
  ChatInputCommandInteraction,
  Activity,
} = require("discord.js");
const botSchema = require("../../schemas/botPresence");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("presence")
    .setDescription("Manage bot activity and status (bot developer only)")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a new presence")
        .addStringOption((opt) =>
          opt
            .setName("name")
            .setDescription("The name of the presence")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("type")
            .setDescription("The type of the presence")
            .setChoices(
              { name: "Competing", value: `${ActivityType.Competing}` },
              { name: "Streaming", value: `${ActivityType.Streaming}` },
              { name: "Listening", value: `${ActivityType.Listening}` },
              { name: "Watching", value: `${ActivityType.Watching}` },
              { name: "Playing", value: `${ActivityType.Playing}` },
              { name: "Custom", value: `${ActivityType.Custom}` }
            )
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("The status of the presence")
            .setChoices(
              { name: "🟢Online", value: "online" },
              { name: "🔴DND", value: "dnd" },
              { name: "🟡Idle", value: "idle" },
              { name: "⬛Offline", value: "offline" },
              { name: "⚫Invisible", value: "invisible" }
            )
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("Remove the last added activity")
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all of the presences")
    )

    .toJSON(),
  deleted: false,

  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [PermissionFlagsBits.Administrator],
  devOnly: true,
//intersection
  /**
   *
   * @param {Client} client
   * @param {ChatInputCommandInteraction} interaction
   */
  run: async (client, interaction) => {
    const subs = interaction.options.getSubcommand();
    const data = await botSchema.findOne({ ClientID: client.user.id });

    switch (subs) {
      case "add":
        const name = interaction.options.getString("name");
        const type = interaction.options.getString("type");
        const status = interaction.options.getString("status");

        if (!data) {
          await botSchema.create({
            ClientID: client.user.id,
            Presences: [
              {
                Activity: [
                  {
                    Name: name,
                    Type: parseInt(type),
                  },
                ],
                Status: status,
              },
            ],
          });
        } else {
          await botSchema.findOneAndUpdate(
            { ClientID: client.user.id },
            {
              $push: {
                Presences: {
                  Activity: [{ Name: name, Type: parseInt(type) }],
                  Status: status,
                },
              },
            }
          );
        }
        return interaction.reply({
          content: `\`✅\` Successfully added the activity \`${name}\` to the bot.`,
          ephemeral: true,
        });

      case "remove":
        if (!data) {
          return interaction.reply({
            content: `\`❌\` There are no presences to remove.`,
            ephemeral: true,
          });
        } else {
          await botSchema.findOneAndUpdate(
            { ClientID: client.user.id },
            {
              $pop: {
                Presences: 1,
              },
            }
          );
        }
        return interaction.reply({
          content: `\`✅\` Successfully removed the last added activity from the bot.`,
          ephemeral: true,
        });

      case "list":
        if (!data) {
          return interaction.reply({
            content: `\`❌\` There are no presences to list.`,
            ephemeral: true,
          });
        }

        const presences = data.Presences;

        const rEmbed = new EmbedBuilder()
          .setTitle(`\`📜\` Activities of the bot`)
          .setColor(`White`)
          .setFooter({
            text: `${client.user.username} - Activity List`,
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
          });

        const activityType = [
          "Playing",
          "Streaming",
          "Listening",
          "Watching",
          "Custom",
          "Competing",
        ];

        const activityStatus = {
          online: "Online",
          dnd: "Do Not Disturb",
          idle: "Idle",
          offline: "Offline",
          invisible: "Invisible",
        };

        presences.forEach((presence, index) => {
          return rEmbed.addFields({
            name: `\`${index + 1}\` - \`${presence.Activity[0].Name}\``,
            value: `**Type:** ${
              activityType[presence.Activity[0].Type]
            }\n**Status:** ${activityType[presence.Status]}`,
          });
        });
        return interaction.reply({ embeds: [rEmbed], ephemeral: true });
    }
  },
};
