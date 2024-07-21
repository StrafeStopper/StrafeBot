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
  const logData = dataGD.IntegrationlLogs.find(
    (arrayData) => arrayData.name === auditActionName
  );
  if (logData) auditEnabled = logData.enabled;
  if (!auditEnabled) return;

  const guildWebhooks = await guild.fetchWebhooks();
  const channelId = dataGD.Webhooks[3]?.channelId;

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

  function getTriggerMetadata(metadata) {
    let result = [];
    const metadataProperties = [
      "keywordFilter",
      "keyword_filter",
      "regexPatterns",
      "regex_patterns",
      "presets",
      "allowList",
      "allow_list",
      "mentionTotalLimit",
      "mention_total_limit",
      "mentionRaidProtectionEnabled",
      "mention_raid_protection_enabled",
    ];

    for (let metadataProperty of metadataProperties) {
      let propertyData = metadata?.[metadataProperty];
      if (!propertyData) continue;

      if (MetadataProperty === "presets") {
        for (let i = 0; i < propertyData.length; i++) {
          propertyData[i] = `\`${
            aConfig.keywordPresetTypes[propertyData[i]]
          }\``;
        }
      }

      if (
        ["mentionTotalLimit", "mention_total_limit"].includes(metadataProperty)
      ) {
        propertyData = [
          `${
            metadata.mentionTotalLimit ?? metadata.mention_total_limit ?? 0
          } unique mentions`,
        ];
        metadataProperty = "mentionTotalLimit";
      }

      if (
        [
          "mentionRaidProtectionEnabled",
          "mention_raid_protection_enabled",
        ].includes(metadataProperty)
      ) {
        propertyData = [
          metadata.mentionRaidProtectionEnabled ??
          metadata.mention_raid_protection_enabled
            ? "`Yes`"
            : "`No`",
        ];
        metadataProperty = "mentionRaidProtectionEnabled";
      }

      result.push([
        `**${metadataProperty}:** \`${propertyData.join("`, `") || "-"}\``,
      ]);
    }

    return result.join("\n\n");
  }

  function getActions(actions) {
    let result = [];
    for (let action of actions) {
      const actionType = aConfig.actionTypes[action.type];
      let actionMetadata;

      switch (action.type) {
        case 1:
          actionMetadata = `*${
            (action.metadata.custom_message ?? action.metadata.customMessage) ||
            "No custom message"
          }*`;
          break;
        case 2:
          actionMetadata = `<#${
            action.metadata.channel_id ?? action.metadata.channelId
          }>`;
          break;
        case 3:
          actionMetadata = `${
            aConfig.timeoutDuration[action.metadata.duration_seconds] ??
            aConfig.timeoutDuration[action.metadata.durationSeconds]
          }`;
          break;
      }

      result.push([`\`${actionType}\` ${actionMetadata}`]);
    }

    return result.join("\n\n");
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
      const extraConversionObj = {
        channel: () => `<#${logData[auditData].id}>`,
        autoModerationRuleTriggerType: () =>
          `\`${aConfig.triggerTypes[logData[auditData]]}\``,

        default: () => `${logData[auditData]?.toString() || "`-`"}`,
      };

      convertedData = extraConversionObj[auditData]
        ? extraConversionObj[auditData]()
        : extraConversionObj.default();
      return convertedData;
    } else {
      if (!isNan(auditData)) {
        convertedData = logData?.permission
          ? "`✅ Allowed`"
          : "`❌ Disallowed`";
        return convertedData;
      }

      const mainConversionObj = {
        id: () => `\`${logData ?? auditLogEntry.targetId}\``,

        triggerType: () => `\`${aConfig.triggerTypes[logData]}\``,
        eventType: () => `\`${aConfig.eventTypes[logData]}\``,
        triggerMetadata: () => `${getTriggerMetadata(logData)}`,
        trigger_metadata: () => `${getTriggerMetadata(logData)}`,
        actions: () => `${getActions(logData)}`,
        enabled: () => (logData ? "`Yes`" : "`No`"),
        exemptRoles: () =>
          logData.size
            ? `<@&${logData.map((role) => role.id).join(">, <@&")}>`
            : "`No roles`",
        exempt_roles: () =>
          logData.length ? `<@&${logData.join(">, <@&")}>` : "`No roles`",
        exemptChannels: () =>
          logData.size
            ? `<#${logData.map((channel) => channel.id).join(">, <#")}>`
            : "`No channels`",
        exempt_channels: () =>
          logData.length ? `<#${logData.join(">, <#")}>` : "`No channels`",

        avatar: () =>
          logData
            ? `[image](https://cdn.discordapp.com/avatars/${auditLogEntry.targetId}/${logData}.png)`
            : "`No avatar icon`",
        avatar_hash: () =>
          logData
            ? `[image](https://cdn.discordapp.com/avatars/${auditLogEntry.targetId}/${logData}.png)`
            : "`No avatar icon`",

        default: () => `${logData?.toString() || "`-`"}`,
      };

      if (auditData.endsWith("channel_id") || auditData.endsWith("channelId")) {
        convertedData = logData ? `<#${logData}>` : "`No channel`";
      } else if (
        auditData.startsWith("$add_") ||
        auditData.startsWith("$remove_")
      ) {
        convertedData = `\`${logData?.join("`, `") || "-"}\``;
      } else if (auditData === "type") {
        if (auditLogEntry.targetType === "Integration") {
          convertedData = `\`${
            logData.charAt(0).toUpperCase() +
            logData.slice(1).replaceAll("_", " ")
          }\``;
        } else {
          convertedData = `\`${aConfig.webhookTypes[logData]}\``;
        }
      } else {
        convertedData = mainConversionObj[auditData]
          ? mainConversionObj[auditData]()
          : mainConversionObj.default();
      }

      return convertedData;
    }
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

        if (auditDataType.includes("*")) {
          const key = auditDataType.slice(0, -1);
          const fieldValue = await convertAuditData(key, auditLogEntry.extra);
          if (!fieldData) continue;

          convertAndAddField(
            `${
              key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")
            }`,
            fieldValue || "`-`",
            true
          );
        } else if (auditDataType.includes("+")) {
          const key = auditDataType.slice(0, -1);
          const fieldValue = await convertAuditData(key, auditLogEntry[key]);
          if (!fieldData) continue;

          convertAndAddField(
            `${
              key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")
            }`,
            fieldValue || "`-`",
            true
          );
        } else {
          const fieldValue = await convertAuditData(auditDataType);
          if (!fieldValue) continue;

          if (["triggerMetadata", "actions"].includes(auditDataType)) {
            convertAndAddField(
              `${
                auditDataType.charAt(0).toUpperCase() +
                auditDataType.slice(1).replaceAll("_", " ")
              }`,
              fieldValue || "`-`"
            );
          } else {
            convertAndAddField(
              `${
                auditDataType.charAt(0).toUpperCase() +
                auditDataType.slice(1).replaceAll("_", " ")
              }`,
              fieldValue || "`-`",
              true
            );
          }
        }
        fieldCount++;
        continue;
      }

      if (changes) {
        const { key, old: oldValue, new: newValue } = auditDataType;

        if (key.startsWith("$add_") || key.startsWith("$remove_")) {
          convertAndAddField(
            "\n200b\nChange",
            `\`${
              key.slice(1).charAt(0).toUpperCase() +
              key.slice(2).replaceAll("_", " ")
            }\``
          );
        } else {
          convertAndAddField(
            "\u200b\nChange",
            `\`${
              key.charAt(0).toUpperCase() + key.slice(1).replaceAll("_", " ")
            }\``
          );
        }

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

    if (moreChnages > 0) {
      convertAndAddField(
        "\u200b",
        `*and \`${moreChanges}\` more ${
          moreChanges > 1 ? "changes" : "change"
        } ...*`
      );
    }
  }

  const channel =
    guild.channels.cache.get(auditLofEntry.target?.id) ||
    guild.channels.cache.get(auditLogEnrry.extra?.channel?.id);
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
    case "All":
      wEmbed.setColor("FFFFFF");
      break;
  }

  const auditActionsObj = {
    ApplicationCommandPermissionUpdate: [
      ["targetId+", ...auditLogEntry.changes],
      [],
      true,
    ],

    AutoModerationRuleCreate: [
      [
        "id",
        "name",
        "triggerType",
        "eventType",
        "triggerMetadata",
        "actions",
        "enabled",
        "exemptRoles",
        "exemptChannels",
      ],
    ],
    AutoModerationRuleUpdate: [["id", ...auditLogEntry.changes], [], true],
    AutoModerationRuleDelete: [["id", "name"]],
    AutoModerationBlockMessage: [
      [
        "targetId+",
        "reason+",
        "channel*",
        "autoModerationRuleName*",
        "autoModerationRuleTriggerType*",
      ],
    ],
    AutoModerationFlagToChannel: [["targetId+", "autoModerationRuleName*"]],
    AutoModerationUserCommunicationDisabled: [
      ["targetId+", "autoModerationRuleName*"],
    ],

    BotAdd: [["id", "username"]],

    IntegrationCreate: [["id", "name", "type"]],
    IntegrationUpdate: [["id", ...auditLogEntry.changes], [], true],
    IntegrationDelete: [["id", "name"]],
    WebhookCreate: [["id", "name", "type", "channelId"]],
    WebhookUpdate: [["id", ...auditLogEntry.changes], [], true],
    WebhookDelete: [["id", "name"]],
  };

  const actionTypes = auditActionsObj[auditActionname];
  if (actionTypes) {
    await getAuditData(...actionTypes);
  }

  auditWebhoook.send({ embeds: [wEmbed] });
};
