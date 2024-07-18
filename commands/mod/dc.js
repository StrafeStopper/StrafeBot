const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	cooldown: 0,
	category: 'mod',
	data: new SlashCommandBuilder()
		.setName('dc')
		.setDescription('Disconnects someone from voice chat')
        .addUserOption((option) => option.setName('user').setDescription('The user to dc').setRequired(true)),

	async execute(interaction) {

        if (!interaction.member.roles.cache.some(role => role.name === 'Admins')) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true})
		}

        const member = interaction.options.getMember('user');
        //const member = interaction.user.id.getMember('user');
        member.timeout(1_000);
        await interaction.reply({ content: `Disconnected ${interaction.options.getMember('user')}.`, ephemeral: true});
		
	},
};