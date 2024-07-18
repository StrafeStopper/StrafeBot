/*const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require('discord.js');
const pollschema = require('../../votes.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Create a new poll')
		.addStringOption(option => option.setName('topic').setDescription('The topic for your poll').setMinLength(1).setMaxLength(2000).setRequired(true)),
		async execute(interaction) {
			await interaction.reply({ content: `Your poll has been started`, ephemeral: true});
			const topic = await interaction.options.getString('topic');

			const embed = new EmbedBuilder()
			.setColor("Green")
			.setAuthor({ name: '🤚 Poll System'})
			.setFooter({ text: '🤚 Poll Started'})
			.setTimestamp()
			.setTitle(`📌 Poll Began`)
			.setDescription(`> ${topic}`)
			.addFields({ name: 'Upvotes', values: `> **No votes**`, inline: true})
			.addFields({ name: 'Downvotes', values: `> **No votes**`, inline: true})
			.addFields({ name: 'Author', values: `> ${interaction.user}`, inline: false})

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

			const msg = await interaction.channel.send({ embeds: [embed], components: [buttons] });
			msg.createMessageComponentCollector();

			await pollschema.create({
				Msg: msg.id,
				Upvote: 0,
				Downvote: 0,
				UpMembers: [],
				DownMembers: [],
				Guild: interaction.guild.id,
				Owner: interaction.user.id
			})

		}
};*/



//poll logic for index.js
/*
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
	}*/