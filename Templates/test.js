const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('This is a test command.')
		.setDMPermission(false)
		.addSubcommandGroup((subcommandgroup) => 
			subcommandgroup
				.setName("user")
				.setDescription("Configure a user.")
				.addSubcommand((subcommand) => 
					subcommand
						.setName("role")
						.setDescription("User role test.")
						.addUserOption(option => option.setName("user").setDescription("The user to configure"))
				)
				.addSubcommand((subcommand) => 
					subcommand
						.setName("nickname")
						.setDescription("User nickname test.")
						.addStringOption(option => option.setName("nickname").setDescription("Set the nickname"))
						.addUserOption(option => option.setName("user").setDescription("The user to nickname"))
				)
			)
            .addSubcommand((subcommand) => 
                subcommand
                    .setName("message")
                    .setDescription("Configure a message.")
            )
            .toJSON(),
            //deleted: true,
            userPermissions: [PermissionFlagsBits.ManageMessages],
            botPermissions: [PermissionFlagsBits.Connect],

            run: (client, interaction) => {
                //interaction.reply("This is a test command.");
                return interaction.editReply("This is a test command.");
            },
};