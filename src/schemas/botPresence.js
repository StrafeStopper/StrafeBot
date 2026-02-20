const { model, Schema } = require("mongoose");

const botPresenceSchema = new Schema(
  {
    ClientID: String,
    Presences: Array,
  },
  {
    strict: true,
  }
);

module.exports = model("botPresence", botPresenceSchema);
