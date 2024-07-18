const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const { Client, Collection, GatewayIntentBits, Events, PermissionsBitField, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ intents: [
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildMembers,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.GuildModeration,
	GatewayIntentBits.GuildScheduledEvents,
	GatewayIntentBits.MessageContent,
	GatewayIntentBits.GuildVoiceStates
] });

client.commands = new Collection();
client.cooldowns = new Collection();

//load commands
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}


for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token);

//Enhance Audit Log
client.on(Events.GuildAuditLogEntryCreate, async auditLog => {
	// Define your variables.
	// The extra information here will be the channel.
	const { action, extra: channel, executorId, targetId } = auditLog;

	// Check only for deleted messages.
	if (action !== AuditLogEvent.MessageDelete) return;

	// Ensure the executor is cached.
	const executor = await client.users.fetch(executorId);

	// Ensure the author whose message was deleted is cached.
	const target = await client.users.fetch(targetId);

	// Log the output.
	console.log(`A message by ${target.tag} was deleted by ${executor.tag} in ${channel}.`);
});