const { model, Schema } = require('mongoose');

let reactionSchema = new Schema({
    GuildID: String,
    Roles: Array,
});

module.exports = model('ReactionRoles', reactionSchema);