const { ActivityType, Client } = require("discord.js");
const botSchema = require("../../schemas/botPresence");

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
    const botSchemaData = await botSchema.findOne({ ClientID: client.user.id });
    //await client.guilds.cache.fetch();
    

    if (!botSchemaData) {
      await botSchema.create({
        ClientID: client.user.id,
        Presences: [
          {
            Activity: [
              {
                Name: `Testing some new features!`,
                Type: ActivityType.Custom,
              },
            ],
            Status: "online",
          },
        ],
      });
    }

    setInterval(async () => {
      const botSchemaData = await botSchema.findOne({
        ClientID: client.user.id,
      });
      //await presence.Activity[0].Name = client.guilds.cache.size;
      const presences = botSchemaData.Presences;
      const i = Math.floor(Math.random() * presences.length);
      const presence = presences[i];
      if (i == 0) {
        presence.Activity[0].Name = `Testing in ${client.guilds.cache.size} servers!`;
      }

      client.user.setPresence({
        activities: [
          { name: presence.Activity[0].Name, type: presence.Activity[0].Type },
        ],
        status: presence.Status,
      });
    }, 15_000);
  };
