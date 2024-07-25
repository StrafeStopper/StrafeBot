const { model, Schema } = require("mongoose");

let roleAssignmentSchema = new Schema(
  {
    GuildID: String,
    Webhooks: Array,
  },
  { strict: false }
);

module.exports = model("roles", roleAssignmentSchema);
