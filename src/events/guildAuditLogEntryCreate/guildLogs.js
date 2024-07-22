const { EmbedBuilder } = require("discord.js");
const loggingSchema = require("../../schemas/auditLogging");
const mConfig = require("../../messageConfig.json");
const aConfig = require("../../auditConfig.json");

module.exports = async (client, auditLogEntry, guild) => {
  let dataGD = await loggingSchema.findOne({ GuildID: guild.id });
  if (!dataGD) return;
  const auditActionValue = auditLogEntry.action;

  let auditActionName;
  aConfig.auditLogList.forEach((auditLog) => {
    if (auditLog.value === auditActionValue) auditActionName = auditLog.event;
  });

  let auditEnabled;
  const logData = dataGD.GuildLogs.find(
    (arrayData) => arrayData.name === auditActionName
  );
  if (logData) auditEnabled = logData.enabled;
  if (!auditEnabled) return;

  const guildWebhooks = await guild.fetchWebhooks();
  const channelId = dataGD.Webhooks[1]?.channelId;

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

  function decimalToHex(decimal) {
    if (isNaN(decimal) || decimal < 0 || decimal > 16777215) {
      return null;
    }

    let hexColor = decimal.toString(16).toUpperCase();
    while (hexColor.length < 6) {
      hexCOlor = "0" + hexColor;
    }

    return "#" + hexColor;
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

    const mainConversionObj = {
      id: () => `\`${logData ?? auditLogEntry.targetId}\``,

      scheduledStartTimestamp: () =>
        logData
          ? `<t:${parseInt(
              logData.toString().slice(0, -3)
            )}>, which is <t:${parseInt(logData.toString().slice(0, -3))}:R>`
          : "`No specified start time`",
      scheduledEndTimestamp: () =>
        logData
          ? `<t:${parseInt(
              logData.toString().slice(0, -3)
            )}>, which is <t:${parseInt(logData.toString().slice(0, -3))}:R>`
          : "`No specified end time`",
      privacy_level: () => `\`${aConfig.eventPrivacyLevel[logData]}\``,
      privacyLevel: () => `\`${aConfig.eventPrivacyLevel[logData]}\``,
      status: () => `\`${aConfig.eventStatus[logData]}\``,
      entity_type: () => `\`${aConfig.eventEntityTypes[logData]}\``,
      entityType: () => `\`${aConfig.eventEntityTypes[logData]}\``,
      image: () =>
        `[image](https://cdn.discordapp.com/guild-events/${auditLogEntry.target.id}/${logData}.png)` ||
        "`No cover image`",

      type: () => `\`${aConfig.stickerTypes[logData]}\``,
      format: () => `\`${aConfig.stickerFormats[logData]}\``,

      icon: () =>
        `[icon](https://cdn.discordapp.com/role-icons/${auditLogEntry.target.id}/${logData}.png)` ||
        "`No role icon`",
      color: () => `\`${decimalToHex(logData)}\``,
      hoist: () => (logData ? "`Yes`" : "`No`"),
      mentionable: () => (logData ? "`Yes`" : "`No`"),
      permissions: () =>
        `\`${
          getBinaryValues(BigInt(logData), "permissions").join("`, `") || "`-`"
        }\``,
      flags: () =>
        `\`${
          [logData].bitfield
            ? "Can be selected in onboarding"
            : "Cannot be selected in onboarding"
        }\``,

      default: () => `${logData?.toString() || "`-`"}`,
    };

    if (auditData.endsWith("channel_id") || auditData.endsWith("channelId")) {
      convertedData = logData ? `<#${logData}>` : "`No channel`";
    } else {
      convertedData = mainConversionObj[auditData]
        ? mainConversionObj[auditData]()
        : mainConversionObj.default();
    }

    return convertedData;
  }

  let moreChanges = 0;
  let fieldCount = 0;
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
        if (fieldCount === 2) {
          convertAndAddField("\u200b", "\u200b");
          fieldCount = 0;
        }
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
        fieldCount++;
        continue;
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
    EmojiCreate: [["id"]],
    EmojiUpdate: [["id", ...auditLogEntry.changes], [], true],
    EmojiDelete: [["id"]],

    GuildScheduledEventCreate: [
      [
        "name",
        "description",
        "id",
        "channelId",
        "scheduledStartTimestamp",
        "scheduledEndTimestamp",
        "privacyLevel",
        "status",
        "entityType",
      ],
    ],
    GuildScheduledEventUpdate: [
      [
        "id",
        "scheduledStartTimestamp",
        "scheduledEndTimestamp",
        ...auditLogEntry.changes,
      ],
      [],
      true,
    ],
    GuildScheduledEventDelete: [["name", "id"]],

    StickerCreate: [["id", "name", "tags", "description", "type", "format"]],
    StickerUpdate: [["id", ...auditLogEntry.changes], [], true],
    StickerDelete: [["id", "name"]],

    RoleCreate: [["id", "name"]],
    RoleUpdate: [["id", ...auditLogEntry.changes], [], true],
    RoleDelete: [["id"]],
  };

  const actionTypes = auditActionsObj[auditActionName];
  if (actionTypes) {
    await getAuditData(...actionTypes);
  }

  auditWebhoook.send({ embeds: [wEmbed] });
};
