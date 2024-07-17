const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('NAME')
		.setDescription('DESCRIPTION'),
	async execute(interaction) {
		await interaction.reply('OUTPUT_TEXT');
	},
};