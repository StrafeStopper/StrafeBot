const { SlashCommandBuilder, Client, Events, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong. (test command').toJSON(),

	userPermissions: [PermissionFlagsBits.SendMessages],
    botPermissions: [PermissionFlagsBits.SendMessages],

	run: async (client, interaction) => {
		//await interaction.reply('Fuck you. ');
		await interaction.reply({ content: `Fuck you. (this message was brought to you by Raid: Shadow Legends in: ${client.ws.ping}ms.)`, ephemeral: false});
	},
};