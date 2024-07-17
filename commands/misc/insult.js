const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('insult')
		.setDescription('Insults the user')
        .addUserOption((option) => option.setName('user').setDescription('The user to insult').setRequired(true)),

	async execute(interaction) {
        //Insult the user
		await interaction.reply(`You suck literal ass${interaction.options.getMember('user')}`);
	},
};