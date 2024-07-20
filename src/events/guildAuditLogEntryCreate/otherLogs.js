const { EmbedBuilder } = require('discord.js');
const loggingSchema = require('../../schemas/auditLogging');
const mConfig = require('../../messageConfig.json');
const aConfig = require('../../auditConfig.json');

module.exports = async (client, auditLogEntry, guild) => {
    let dataGD = await loggingSchema.findOne({ GuildID: guild.id });
    if (!dataGD) return;
    const auditActionValue = auditLogEntry.action;

    let auditActionName;
    aConfig.auditLogList.forEach((auditLog) => {
        if (auditLog.value === auditActionValue) auditActionName = auditLog.event;
    });

    let auditEnabled;
    const logData = dataGD.OtherLogs.find((arrayData) => arrayData.name === auditActionName);
    if (logData) auditEnabled = logData.enabled;
    if (!auditEnabled) return;

    const guildWebhooks = await guild.fetchWebhooks();
    const channelId = dataGD.Webhooks[4]?.channelId;

    const clientChannelWebhooks = guildWebhooks.filter((w) => w.name === client.user.username && w.channelId === channelId);
    if(!clientChannelWebhooks) return;

    const auditWebhoook = clientChannelWebhooks.first();
    if (!auditLogEntry.executor) {
        const targetExecutor = await guild.members.fetch(auditLogEntry.executorId);
        auditLogEntry.executor = targetExecutor.user;
    };

    const wEmbed = new EmbedBuilder()
        .setAuthor({
            iconURL: auditLogEntry.executor?.displayAvatarURL({ dynamic: true}),
            name: `${auditLogEntry.executor?.username || "An unknown user"} created an Audit Log event`,
        })
        .setTimestamp()
        .setFooter({
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
            text: `${client.user.ucername} - Audit Log system`
        });

    function getBinaryValues( bigIntValue, bitField) {
        const result = [];
        for (let i =0; i < Object.keys(aConfig[bitField]).length; i++) {
            const bit = BigInt(1) << BigInt(i);

            if ((bigIntValue & bit) !== BigInt(0)) {
                const value = aConfig[bitField][bit.toString()];
                if(!value || result.includes(value)) {
                    continue;
                };

                result.push(value);
            };
        };

        return result;
    };

        async function convertAuditData(auditData, optionalValue, changes = false) {
            let convertedData, logData;
            if (changes) {
                optionalValue !== undefined ? logData = optionalValue : logData = undefined;
            } else {
                optionalValue !== undefined ? logData = optionalValue : logData = auditLogEntry.target?.[auditData];
            };

    
            const mainConversionObj = {
                "id": () => `\`${logData ?? auditLogEntry.targetId}\``,
              
                "icon_hash": () => `[image](https://cdn.discordapp.com/icons/${guild.id}/${logData}.${logData?.startsWith("a_") ? "gif" : "png"})` || "`No server icon`",
                "splash": () => `[image](https://cdn.discordapp.com/splashes/${guild.id}/${logData}.png)` || "`No invite splash image`",
                "discovery_splash": () => `[image](https://cdn.discordapp.com/discovery-splashes/${guild.id}/${logData}.png)` || "`No discovery splash image`",
                "owner_id": () => `<@${logData}>`,
                "afk_timeout": () => `\`${logData / 60} ${logData === 60 ? "minute" : "minutes"}\``,
                "widget_enabled": () => (logData ? "`Yes`" : "`No`"),
                "verification_level": () => `\`${aConfig.verificationLevels[logData]}\``,
                "default_message_notifications": () => (logData ? "`Only @mentions`" : "`All messages`"),
                "explicit_content_filter": () => `\`${aConfig.explicitContentFilterLevels[logData]}\``,
                "features": () => `\`${logData.join("\`, \`")}\``,
                "mfa_level": () => (logData ? "`2FA requirement`" : "`No MFA/2FA requirement`"),
                "system_channel_flags": () => `\`${getBinaryValues(BigInt(logData), "systemChannelFlags").join("\`, \`") || "`-`"}\``,
                "banner": () => `[image](https://cdn.discordapp.com/banners/${guild.id}/${logData}.${logData?.startsWith("a_") ? "gif" : "png"})` || "`No server banner`",
                "premium_tier": () => `\`${aConfig.premiumTiers[logData]}\``,
                "preferred_locale": () => `\`${aConfig.locales[logData]}\``,
                "premium_progress_bar_enabled": () => (logData ? "`Yes`" : "`No`"),
              
                "inviterId": () => `<@${logData}>`,
                "temporary": () => (logData ? "`Yes`" : "`No`"),
              
                "privacyLevel": () => `\`${aConfig.eventPrivacyLevel[logData]}\``,
              
                "default": () => `${logData?.toString() || "`-`"}`
                };

                if (auditData.endsWith("channel_id") || auditData.endsWith("channelId")) {
                    convertedData = logData ? `<#${logData}>` : "`No channel`";
                } else {
                    convertedData = mainConversionObj[auditData] ? mainConversionObj[auditData]() : mainConversionObj.default();
                };


                return convertedData;
        };

        let moreChanges = 0;
        let fieldCount = 0;
        async function getAuditData(auditDataTypes, exceptions = [], changes = false) {
            for (const auditDataType of auditDataTypes) {
                if (exceptions.includes(auditDataType)) continue;

                if (wEmbed.data.fields?.length >= 24) {
                    moreChanges++;
                    continue;
                };

                const convertAndAddField = ( name, value, inline = false ) => {
                    wEmbed.addFields([{ name, value, inline }]);
                };

                if (typeof auditDataType === "string") {
                    if (fieldCount === 2) {
                        convertAndAddField("\u200b", "\u200b");
                        fieldCount = 0;
                    };

                    const fieldValue = await convertAuditData(auditDataType);
                    if (!fieldValue) continue;

                    convertAndAddField(`${auditDataType.charAt(0).toUpperCase() + auditDataType.slice(1).replaceAll("_", " ")}`, fieldValue || "`-`", true);
                    fieldCount++;
                    continue;
                };

                if (changes) {
                    const { key, old: oldValue, new: newValue } = auditDataType;

                    convertAndAddField("\u200b\nChange", `\`${key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")}\``);
                    convertAndAddField("From", await convertAuditData(key, oldValue, true) || "`-`", true);
                    convertAndAddField("To", await convertAuditData(key, oldValue, true) || "`-`", true);
                };
            };

            if (moreChnages > 0) {
                convertAndAddField("\u200b", `*and \`${moreChanges}\` more ${moreChanges > 1 ? "changes" : "change"} ...*`);
            };
        };

        const channel = guild.channels.cache.get(auditLofEntry.target?.id) || guild.channels.cache.get(auditLogEnrry.extra?.channel?.id);
        wEmbed.setTitle(`Event: \`${auditActionName}\`${channel ? ` > ${channel}` : ""}`);

        switch (auditLogEntry.actionType) {
            case "Create":
                wEmbed.setColor(mConfig.embedColorSuccess);
                break;
            case "Update":
                wEmbed.setColor(mConfig.embedColorWarning);
                break;
            case "Delete":
                wEmbed.setColor(mConfig.embedColorError);
                break;
        };


  

  
const auditActionsObj = {
  "GuildUpdate": [auditLogEntry.changes, [], true],

  "InviteCreate": [["code", "temporary", "maxAge", "maxUses", "inviterId", "channelId"]],
  "InviteDelete": [["code", "inviterId", "channelId"]],

  "StageInstanceCreate": [["id", "topic", "privacyLevel"]],
  "StageInstanceUpdate": [["id", ...auditLogEntry.changes], [], true],
  "StageInstanceDelete": [["id"]],
};
  

    const actionTypes = auditActionsObj[auditActionname];
    if(actionTypes) {
        await getAuditData( ... actionTypes);
    };

    auditWebhoook.send({ embeds: [wEmbed] });
};