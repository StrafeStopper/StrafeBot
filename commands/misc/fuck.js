const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fuck')
		.setDescription('Fucks someone for you')
        .addUserOption((option) => option.setName('user').setDescription('The user to fuck').setRequired(true)),

	async execute(interaction) {
		await interaction.reply(`${interaction.member.user}` + ` fucked ${interaction.options.getMember('user')}`);
	},
};