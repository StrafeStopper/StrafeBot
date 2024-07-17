// Require the necessary discord.js classes

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, 'GuildMessagePolls'] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
// Keep token secret
client.login(token);

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}


//poll logic

const pollschema = require('./votes.js');

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!interaction.guild) return;
	if (!interaction.message) return;
	if (!interaction.isButton) return;

	const data = await pollschema.findOne({ Guild: interaction.guild.id, Msg: interaction.message.id });
	if (!data) return;
	const msg = await interaction.channel.messages.fetch(data.Msg);

	if(interaction.customId === 'up') {
		if (data.UpMembers.includes(i.user.id)) return await i.reply({ content: `You cannot vote again!`, ephemeral: true });

		let downvotes = data.Downvotes;
		if (data.Downmembers.includes(i.user.id)) {
			downvotes = downvotes - 1;
		}

		const newembed = EmbedBuilder.from(msg.embeds[0]).setFields({ name: `Upvotes`, value: `> **${data.Upvote + 1}** votes`, inline: true}, { name: `Downvotes`, value: `> **${downvotes}** votes`, inline: true}, { name: `Author`, value: `> <@${data.owner}>`} )

		const buttons = new ActionRowBuilder()
			.addComponents(

				new ButtonBuilder()
				.setCustomId('up')
				.setLabel('✅')
				.setStyle(ButtonStyle.Secondary), 

				new ButtonBuilder()
				.setCustomId('down')
				.setLabel('❌')
				.setStyle(ButtonStyle.Secondary), 

				new ButtonBuilder()
				.setCustomId('votes')
				.setLabel('Votes')
				.setStyle(ButtonStyle.Secondary), 
			)

			await i.update({ embeds: [newembed], components: [button]});

			data.Upvote++;

			if (data.Downmembers.includes(i.user.id)) {
				data.Downvotes = data.Downvotes - 1;
			}

			data.UpMembers.push(i.user.id);
			data.Downmembers.pull(i.user.id);
			data.save();

	}

	if (i.customId === 'down') {

		if (data.Downmembers.includes(i.user.id)) return await i.reply({ content: 'You cannot vote again!', ephemeral: true});

		let upvotes = data.Upvote;
		if (data.UpMembers.includes(i.user.id)) {
			upvotes = upvotes - 1;
		}

		const newembed = EmbedBuilder.from(msg.embeds[0]).setFields({ name: `Upvotes`, value: `> **${upvotes}** votes`, inline: true}, { name: `Downvotes`, value: `> **${data.Downvote + 1}** votes`, inline: true}, { name: `Author`, value: `> <@${data.owner}>`} )

		const buttons = new ActionRowBuilder()
			.addComponents(

				new ButtonBuilder()
				.setCustomId('up')
				.setLabel('✅')
				.setStyle(ButtonStyle.Secondary), 

				new ButtonBuilder()
				.setCustomId('down')
				.setLabel('❌')
				.setStyle(ButtonStyle.Secondary), 

				new ButtonBuilder()
				.setCustomId('votes')
				.setLabel('Votes')
				.setStyle(ButtonStyle.Secondary), 
			)

			await i.update({ embeds: [newembed], components: [buttons] });

			data.Downvotes++;

			if ( data.UpMembers.includes(i.user.id)) {
				data.Upvote = data.Upvote - 1;
			}

			data.Downmembers.push(i.user.id);
			data.UpMembers.pull(i.user.id);
			data.save();

	}

	if (i.customId === 'votes' ) {

		let upvoters = [];
		await data.UpMembers.forEach( async => {
			upvoters.push(`<@${member}>`)
		});

		let downvoters = [];
		await data.DownMembers.forEach( async => {
			downvoters.push(`<@${member}>`)
		});

		const embed = new EmbedBuilder()
			.setColor("Red")
			.setAuthor({ name: '🤚 Poll System'})
			.setFooter({ text: '🤚 Poll Members'})
			.setTimestamp()
			.setTitle(`Poll Votes`)
			.addFields({ name: `Upvoters (${upvoters.length})`, values: `> ${upvoters.join(', ').slice(0, 1020) || `No Upvoters!`}`, inline: true})
			.addFields({ name: `Downvoters (${downvoters.length})`, values: `> ${downvoters.join(', ').slice(0, 1020) || `No Downvoters!`} `, inline: true})

			await i.reply({ embeds: [embed], ephemeral: true});
	}

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
	console.log(interaction);
});
