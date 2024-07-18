const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: 60,
	category: 'misc',
	data: new SlashCommandBuilder()
		.setName('fuck')
		.setDescription('Fucks someone for you')
        .addUserOption((option) => option.setName('user').setDescription('The user to fuck').setRequired(true)),

	async execute(interaction) {

		if (interaction.options.getMember('user') == 551870229483880471)
		{
			await interaction.reply(`undefined` + ` fucked ${interaction.options.getMember('user')}`);
		} else
		await interaction.reply(`${interaction.member.user}` + ` fucked ${interaction.options.getMember('user')}`);
		
	},
};