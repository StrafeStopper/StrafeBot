const path = require("path");
const getAllFiles = require("../utils/getAllFiles");

module.exports = (client) => {
  const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

  for (const eventFolder of eventFolders) {
    const eventFiles = getAllFiles(eventFolder);
    let eventName;
    eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    eventName === "validations" ? (eventName = "interactionCreate") : eventName;

    client.on(eventName, async (...args) => {
      process.setMaxListeners(0);
      for (const eventFile of eventFiles) {
        const eventFunction = require(eventFile);
        await eventFunction(client, ...args);
      }
    });
  }
};
