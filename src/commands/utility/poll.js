const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');



module.exports = {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Creates a new poll (server moderator only)')
		.addStringOption(option =>
			option.setName('title')
				.setDescription('Title for the poll')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('body')
				.setDescription('Description for the poll')
				.setRequired(true)).toJSON(),

	userPermissions: [PermissionFlagsBits.ManageMessages],
	botPermissions: [PermissionFlagsBits.ManageMessages],
			
	run: async (client, interaction) => {

		if (!interaction.member.roles.cache.some(role => role.name === 'Admins')) {
			return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true})
		}

        await interaction.reply({ content: `Poll created below.`, ephemeral: true});
		const title = await interaction.options.getString('title');
		const body = await interaction.options.getString('body');

		const pollEmbed = new EmbedBuilder()
			.setColor(0x6495ED)
			.setTitle(title)
			.setAuthor({name: `${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL()})
			.setTimestamp()
			.setDescription(body)
			

		await interaction.channel.send('@here');
		const message = await interaction.channel.send({ embeds: [pollEmbed], fetchReply: true});
		message.react('✅');
		message.react('❌');
		
	},
};