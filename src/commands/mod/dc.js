const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dc')
		.setDescription('Disconnects someone from voice chat')
        .addUserOption(option => option.setName("user").setDescription('The user to dc').setRequired(true)).toJSON(),

	userPermissions:[PermissionFlagsBits.MoveMembers],
	botPermissions: [PermissionFlagsBits.MoveMembers],

	run: async (client, interaction) => {

        const member = interaction.options.getMember('user');
        member.timeout(1_000);
        await interaction.reply({ content: `Disconnected ${interaction.options.getMember('user')}.`, ephemeral: true});
		
	},
};