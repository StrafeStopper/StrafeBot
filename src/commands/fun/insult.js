const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('insult')
		.setDescription('Insults the user.')
        .addUserOption((option) => option.setName('user').setDescription('The user to insult').setRequired(true)).toJSON(),
	deleted: false,

	
	userPermissions: [PermissionFlagsBits.SendMessages],
	botPermissions: [PermissionFlagsBits.SendMessages],
	
	run: async (client, interaction) => {
        //Insult the user
		await interaction.reply(`You suck literal ass, ${interaction.options.getMember('user')}`);
	},
};