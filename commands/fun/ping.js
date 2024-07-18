const { SlashCommandBuilder, Client, Events, GatewayIntentBits } = require('discord.js');

module.exports = {
	cooldown: 0,
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Fuck you. ');
		await interaction.reply({ content: `(this message was brought to you by Raid: Shadow Legends in: ${client.ws.ping}ms.)`, ephemeral: true});
	},
};