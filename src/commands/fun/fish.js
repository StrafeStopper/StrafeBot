const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fish')
		.setDescription('Try to catch a fish!').toJSON(),


	userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],

	run: async (client, interaction) => {
		await interaction.reply(`${interaction.user}, fuck you. It's not ready yet and won't be for a while.`);
	},
};