const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fuck')
		.setDescription('Fucks someone for you.')
        .addUserOption((option) => option.setName('user').setDescription('The user to fuck').setRequired(true))
		.addStringOption( option => 
			option.setName('text')
			.setDescription('Add additional text to the message.')
			.setRequired(true)).toJSON(),
	
	userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],

	run: async (client, interaction) => {
		
		const text = interaction.options.getString('text');
		if (interaction.options.getMember('user') == 551870229483880471)
		{
			await interaction.reply(`undefined` + ` fucked ${interaction.options.getMember('user')}`);
		} else
		await interaction.reply(`${interaction.member.user}` + ` fucked ${interaction.options.getMember('user')}` /*+ text*/);
		
	},
};