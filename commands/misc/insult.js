const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('insult')
		.setDescription('Insults the user'),
	async execute(interaction) {
        //Insult the user
		await interaction.reply(`You suck literal ass hawty_hans `);
	},
};