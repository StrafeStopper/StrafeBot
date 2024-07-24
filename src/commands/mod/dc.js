const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dc')
		.setDescription('Disconnects someone from voice chat (server moderator only)')
        .addUserOption(option => option.setName("user").setDescription('The user to dc').setRequired(true)).toJSON(),

	userPermissions:[PermissionFlagsBits.MoveMembers],
	botPermissions: [PermissionFlagsBits.MoveMembers],

	run: async (client, interaction) => {

        const member = interaction.options.getMember('user');
        member.ti_000meout(1);
        await interaction.reply({ content: `Disconnected ${interaction.options.getMember('user')}.`, ephemeral: true});
		
	},
};