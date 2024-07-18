const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    category: 'fun',
	data: new SlashCommandBuilder()
		.setName('fish')
		.setDescription('Try to catch a fish!'),
	async execute(interaction) {
		await interaction.reply(`${interaction.user}, fuck you. It's not ready yet and won't be for a while.`);
	},
};