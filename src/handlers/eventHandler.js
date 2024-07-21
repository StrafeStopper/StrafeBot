const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = (client, guildId) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    let eventName;

    eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    eventName === "validations" ? (eventName = "interactionCreate") : eventName;

    client.on(eventName, async (arg) => {
      console.log("Event Triggered:", eventName);
      console.log("Guild ID:", guildId);
      const guild = client.guilds.cache.get(guildId);
      console.log("Retrieved Guild:", guild);
      for (const eventFile of eventFiles) {
        const eventFunction = require(eventFile);
        await eventFunction(client, arg, guild);
      }
    });
  }
};
