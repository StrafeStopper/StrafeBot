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
    const logData = dataGD.MemberLogs.find((arrayData) => arrayData.name === auditActionName);
    if (logData) auditEnabled = logData.enabled;
    if (!auditEnabled) return;

    const guildWebhooks = await guild.fetchWebhooks();
    const channelId = dataGD.Webhooks[2]?.channelId;

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

    function getRoles(rolesData) {
        const result = [];
        for (let i =0; i < rolesData?.length; i++) {
            const roleId = rolesData[i].id;

            if (roleId) {
                result.push(`<@&${roleId}>`);
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

        if (auditLogEntry.extra && logData === auditLogEntry.extra) {

            const extraConversionObj = {
                "channel": () => `<#${logData[auditData].id}>`,
                "default": () => `${logData[AuditData]?.toString() || "`-`"}`
              };

            convertedData = extraConversionObj[auditData] ? extraConversionObj[auditData]() : extraConversionObj.default();
            return convertedData;
                
        } else {
            const mainConversionObj = {
                "id": () => `\`${logData ?? auditLogEntry.targetId}\``,
              
                "$add": () => `${getRoles(logData)?.join(", ") || "`-`"}`,
                "$remove": () => `${getRoles(logData)?.join(", ") || "`-`"}`,
              
                "premium_since": () => (logData ? `<t:${parseInt(logData.toString().slice(0, -3))}>` : "`Not a server booster`"),
                "deaf": () => (logData ? "`Yes`" : "`No`"),
                "mute": () => (logData ? "`Yes`" : "`No`"),
                "flags": () => `\`${getBinaryValues(BigInt(logData), "guildMemberFlags").join("\`, \`") || "`-`"}\``,
                "pending": () => (logData ? "`Yes - Member has not passed the Membership Screening requirements of the guild`" : "`No - Member has passed the Membership Screening requirements of the guild`"),
                "communication_disabled_until": () => (`<t:${parseInt(logData.toString().slice(0, -3))}>, which is <t:${parseInt(logData.toString().slice(0, -3))}:R>`),
              
                "default": () => `${logData?.toString() || "`-`"}`
              };

              if (auditData.endsWith("channel_id") || auditData.endsWith("channelId")) {
                convertedData = logData ? `<#${logData}>` : "`No channel`";
            } else {
                if (auditData.startsWith("communication")) {
                    const date = new Date(logData);
                    logData = date.getTime();
                };
                convertedData = mainConversionObj[auditData] ? mainConversionObj[auditData]() : mainConversionObj.default();
            };
            return convertedData;

        };
    };



        let moreChanges = 0;
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
                    if (auditDataType.includes("*")) {
                        const key = auditDataType.slice(0, -1);
                        const fieldValue = await convertAuditData(key, auditLogEntry.extra);
                        if (!fieldData) continue;

                        convertAndAddField(`${key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")}`, fieldValue || "`-`", true);
                        continue;
                    } else if (auditDataType.includes("+")) {
                        const key = auditDataType.slice(0, -1);
                        const fieldValue = await convertAuditData(key, auditLogEntry[key]);
                        if (!fieldData) continue;

                        convertAndAddField(`${key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")}`, fieldValue || "`-`", true);
                        continue;
                    } else {
                        const fieldValue = await convertAuditData(auditDataType);
                        if (!fieldValue) continue;

                        convertAndAddField(`${auditDataType.charAt(0).toUpperCase() + auditDataType.slice(1).replaceAll("_", " ")}`, fieldValue || "`-`", true);
                        continue;
                    };
                };

                if (changes) {
                    const { key, old: oldValue, new: newValue } = auditDataType;

                    if (["$add", "$remove"].includes(key)) {
                        convertAndAddField("\u200b\nChange", `\`${key.slice(1).charAt(0).toUpperCase() + key.slice(2).replaceAll("_", " ")}\``);
                        convertAndAddField("Role(s)", await convertAuditData(key, newValue, true), true);
                    } else {
                        convertAndAddField("\u200b\nChange", `\`${key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")}\``);

                        if (key.startsWith("communication")) {
                            convertAndAddField("Timeout active until", await convertAuditData(key, trueValue, true), true);
                        } else {
                            convertAndAddField("From", await convertAuditData(key, oldValue, true) || "`-`", true);
                            convertAndAddField("To", await convertAuditData(key, oldValue, true) || "`-`", true);
                        };
                    };
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
            "MemberKick": [["id", "username", "reason+"]],
            "MemberPrune": [["removed*", "days*"]],
            "MemberBanAdd": [["id", "username", "reason+"]],
            "MemberBanRemove": [["id", "username"]],
          
            "MemberDisconnect": [["count*"]],
            "MemberMove": [["channel*", "count*"]],
          
            "MemberRoleUpdate": [["id", "username", ...auditLogEntry.changes], [], true],
            "MemberUpdate": [["id", "username", ...auditLogEntry.changes], [], true]
          };
  

        const actionTypes = auditActionsObj[auditActionname];
        if(actionTypes) {
            await getAuditData( ... actionTypes);
        };

        auditWebhoook.send({ embeds: [wEmbed] });
};