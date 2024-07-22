const { EmbedBuilder, Guild } = require("discord.js");
const loggingSchema = require("../../schemas/auditLogging");
const mConfig = require("../../messageConfig.json");
const aConfig = require("../../auditConfig.json");
const packageJson = require("../../../package.json");

module.exports = async (client, auditLogEntry, guild) => {

  if (!guild || !guild.id) {
    console.error("Guild or Guild ID is undefined");
    return;
  }
  let dataGD = await loggingSchema.findOne({ GuildID: guild.id });
  if (!dataGD) return;
  const auditActionValue = auditLogEntry.action;

  let auditActionName;
  aConfig.auditLogList.forEach((auditLog) => {
    if (auditLog.value === auditActionValue) auditActionName = auditLog.event;
  });

  let auditEnabled;
  const logData = dataGD.ChannelLogs.find(
    (arrayData) => arrayData.name === auditActionName
  );
  if (logData) auditEnabled = logData.enabled;
  if (!auditEnabled) return;

  const guildWebhooks = await guild.fetchWebhooks();
  const channelId = dataGD.Webhooks[0]?.channelId;

  const clientChannelWebhooks = guildWebhooks.filter(
    (w) => w.name === client.user.username && w.channelId === channelId
  );
  if (!clientChannelWebhooks) return;

  const auditWebhoook = clientChannelWebhooks.first();
  if (!auditLogEntry.executor) {
    const targetExecutor = await guild.members.fetch(auditLogEntry.executorId);
    auditLogEntry.executor = targetExecutor.user;
  }

  const wEmbed = new EmbedBuilder()
    .setAuthor({
      iconURL: auditLogEntry.executor?.displayAvatarURL({ dynamic: true }),
      name: `${
        auditLogEntry.executor?.username || "An unknown user"
      } created an Audit Log event`,
    })
    .setTimestamp()
    .setFooter({
      iconURL: client.user.displayAvatarURL({ dynamic: true }),
      text: `${client.user.ucername} - Audit Log system`,
    });

  function getBinaryValues(bigIntValue, bitField) {
    const result = [];
    for (let i = 0; i < Object.keys(aConfig[bitField]).length; i++) {
      const bit = BigInt(1) << BigInt(i);

      if ((bigIntValue & bit) !== BigInt(0)) {
        const value = aConfig[bitField][bit.toString()];
        if (!value || result.includes(value)) {
          continue;
        }

        result.push(value);
      }
    }

    return result;
  }

  async function convertAuditData(auditData, optionalValue, changes = false) {
    let convertedData, logData;
    if (changes) {
      optionalValue !== undefined
        ? (logData = optionalValue)
        : (logData = undefined);
    } else {
      optionalValue !== undefined
        ? (logData = optionalValue)
        : (logData = auditLogEntry.target?.[auditData]);
    }

    if (auditLogEntry.extra && logData === auditLogEntry.extra) {
      const fetchedMember = await guild.members
        .fetch(auditLogEntry.extra.id)
        .catch(() => {
          return null;
        });

      const fetchedRole = await guild.roles
        .fetch(auditLogEntry.extra.id)
        .catch(() => {
          return null;
        });

      const extraConversionObj = {
        id: () => `${fetchedMember ?? fetchedRole} - \`${logData[auditData]}\``,
        role_name: () =>
          `${guild.roles.cache.get(
            (role) => role.name === logData[auditData]
          )}>`,
        type: () => (fetchedMember ? "`Member`" : "`Role`"),
        user: () => `${logData[auditData]}`,
        channel: () => `<#${logData[auditData].id}>`,
        messageId: () =>
          `\`${logData[auditData]}\` - [Go to message](https://discord.com/channels/${guild.id}/${auditLogEntry.extra?.channel?.id}/${logData[auditData]})`,

        default: () => `${logData[auditData]?.toString() || "`-`"}`,
      };

      convertedData = extraConversionObj[auditData]
        ? extraConversionObj[auditData]()
        : extraConversionObj.default();
      return convertedData;
    } else {
      const mainConversionObj = {
        id: () => `\`${logData ?? auditLogEntry.targetId}\``,

        type: () => `\`${aConfig.channelTypes[logData]}\``,
        permission_overwrites: () =>
          logData ? `\`${logData.join("`, `")}\`` : "`-`",
        allow: () =>
          `\`${
            getBinaryValues(BigInt(logData), "permissions").join("`, `") ||
            "`-`"
          }\``,
        deny: () =>
          `\`${
            getBinaryValues(BigInt(logData), "permissions").join("`, `") ||
            "`-`"
          }\``,
        topic: () => `${logData || "`No topic`"}`,
        nsfw: () => (logData ? "`Yes`" : "`No`"),
        bitrate: () => `\`${logData / 1000}\`kbps`,
        user_limit: () => `\`${logData}\` users`,
        userLimit: () => `\`${logData}\` users`,
        rate_limit_per_user: () => `Slowmode: \`${logData || 0}\` seconds`,
        rateLimitPerUser: () => `Slowmode: \`${logData || 0}\` seconds`,
        parent_id: () => `<#${logData}>`,
        parentId: () => `<#${logData}>`,
        rtc_region: () => `${logData || "`Automatic`"}`,
        rtcRegion: () => `${logData || "`Automatic`"}`,
        video_quality_mode: () => (logData === 1 ? "`Automatic`" : "`720p`"),
        default_auto_archive_duration: () =>
          `\`${aConfig.archiveDuration[logData] || "-"}\``,
        flags: () =>
          `\`${
            getBinaryValues(BigInt(logData), "channelFlags").join("`, `") ||
            "`-`"
          }\``,
        default_reaction_emoji: () =>
          `${guild.emojis.cache.get(logData.emoji_id) || logData.emoji_name}`,
        archived: () => (logData ? "`Yes`" : "`No`"),
        auto_archive_duration: () =>
          `\`${aConfig.archiveDuration[logData || 0]}\``,
        autoArchiveDuration: () =>
          `\`${aConfig.archiveDuration[logData || 0]}\``,
        locked: () => (logData ? "`Yes`" : "`No`"),
        invitable: () => (logData ? "`Yes`" : "`No`"),
        username: () => `${logData?.toString() || "`Unknown user`"}`,

        default: () => `${logData?.toString() || "`-`"}`,
      };

      convertedData = mainConversionObj[auditData]
        ? mainConversionObj[auditData]()
        : mainConversionObj.default();
      return convertedData;
    }
  }

  let moreChanges = 0;
  async function getAuditData(
    auditDataTypes,
    exceptions = [],
    changes = false
  ) {
    for (const auditDataType of auditDataTypes) {
      if (exceptions.includes(auditDataType)) continue;

      if (wEmbed.data.fields?.length >= 24) {
        moreChanges++;
        continue;
      }

      const convertAndAddField = (name, value, inline = false) => {
        wEmbed.addFields([{ name, value, inline }]);
      };

      if (typeof auditDataType === "string") {
        if (auditDataType.includes("*")) {
          const key = auditDataType.slice(0, -1);
          const fieldValue = await convertAuditData(key, auditLogEntry.extra);
          if (!fieldValue) continue;

          convertAndAddField(
            `${
              key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")
            }`,
            fieldValue || "`-`",
            true
          );
          continue;
        } else {
          const fieldValue = await convertAuditData(auditDataType);
          if (!fieldValue) continue;

          convertAndAddField(
            `${
              auditDataType.charAt(0).toUpperCase() +
              auditDataType.slice(1).replaceAll("_", " ")
            }`,
            fieldValue || "`-`",
            true
          );
          continue;
        }
      }

      if (changes) {
        const { key, old: oldValue, new: newValue } = auditDataType;

        convertAndAddField(
          "\u200b\nChange",
          `\`${
            key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")
          }\``
        );
        convertAndAddField(
          "From",
          (await convertAuditData(key, oldValue, true)) || "`-`",
          true
        );
        convertAndAddField(
          "To",
          (await convertAuditData(key, oldValue, true)) || "`-`",
          true
        );
      }
    }

    if (moreChanges > 0) {
      convertAndAddField(
        "\u200b",
        `*and \`${moreChanges}\` more ${
          moreChanges > 1 ? "changes" : "change"
        } ...*`
      );
    }
  }

  const channel =
    guild.channels.cache.get(auditLogEntry.target?.id) ||
    guild.channels.cache.get(auditLogEntry.extra?.channel?.id);
  wEmbed.setTitle(
    `Event: \`${auditActionName}\`${channel ? ` > ${channel}` : ""}`
  );

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
  }

  const auditActionsObj = {
    ChannelCreate: [["type", "topic", "id"]],
    ChannelUpdate: [
      auditLogEntry.changes,
      ["available_tags", "template", "icon_emoji"],
      true,
    ],
    ChannelDelete: [["name", "type"]],

    ChannelOverwriteCreate: [["id*", "type*"]],
    ChannelOverwriteUpdate: [
      ["id*", "type*", ...auditLogEntry.changes],
      ["available_tags", "template", "icon_emoji"],
      true,
    ],
    ChannelOverwriteDelete: [["id*", "type*"]],

    MessageBulkDelete: [["name", "count*"]],
    MessageDelete: [["username", "channel*", "count*"]],

    MessagePin: [["channel*", "messageId*"]],
    MessageUnpin: [["channel*", "messageId*"]],

    ThreadCreate: [["name", "parentId", "type", "autoArchiveDuration"]],
    ThreadUpdate: [auditLogEntry.changes, [], true],
    ThreadDelete: [["name", "type"]],
  };

  const actionTypes = auditActionsObj[auditActionName];
  if (actionTypes) {
    await getAuditData(...actionTypes);
  }

  auditWebhoook.send({ embeds: [wEmbed] });
};
