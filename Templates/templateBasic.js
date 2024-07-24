const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('name')
		.setDescription('description'),
	deleted: true,
	async execute(interaction) {
		await interaction.reply('OUTPUT_TEXT');
	},
};