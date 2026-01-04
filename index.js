import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  ChannelType
} from "discord.js";

/* ---------------- CLIENT ---------------- */

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ---------------- ENV VARIABLES ---------------- */

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const STATIC_ROLE_IDS = process.env.STATIC_ROLE_ID
  ?.split(",")
  .map(id => id.trim());

if (!DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN is missing");
}

if (!STATIC_ROLE_IDS || STATIC_ROLE_IDS.length === 0) {
  throw new Error("STATIC_ROLE_ID is missing");
}

/* ---------------- COMMAND DEFINITIONS ---------------- */

const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Message text")
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Optional image")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("updatestatic")
    .setDescription("Update a static message")
    .addStringOption(option =>
      option
        .setName("message_id")
        .setDescription("Message ID to edit")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("New message text")
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("New image")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("setstaticforum")
    .setDescription("Create a static forum post")
    .addStringOption(option =>
      option
        .setName("title")
        .setDescription("Forum post title")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Post content")
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Optional image")
        .setRequired(false)
    )
];

/* ---------------- REGISTER GLOBAL COMMANDS ---------------- */

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(cmd => cmd.toJSON()) }
  );

  console.log("Global slash commands registered.");
});

/* ---------------- INTERACTION HANDLER ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* ---------- ROLE CHECK ---------- */
  const hasRole = interaction.member.roles.cache.some(role =>
    STATIC_ROLE_IDS.includes(role.id)
  );

  if (!hasRole) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true
    });
  }

  /* ---------- /setstatic ---------- */
  if (interaction.commandName === "setstatic") {
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    await interaction.channel.send({
      content: message || null,
      files: image ? [image] : []
    });

    return interaction.reply({
      content: "Message sent.",
      ephemeral: true
    });
  }

  /* ---------- /updatestatic ---------- */
  if (interaction.commandName === "updatestatic") {
    const messageId = interaction.options.getString("message_id");
    const newMessage = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    const msg = await interaction.channel.messages.fetch(messageId);

    await msg.edit({
      content: newMessage || msg.content || null,
      files: image ? [image] : []
    });

    return interaction.reply({
      content: "Message updated.",
      ephemeral: true
    });
  }

  /* ---------- /setstaticforum ---------- */
  if (interaction.commandName === "setstaticforum") {
    const isForum =
      interaction.channel.type === ChannelType.GuildForum ||
      interaction.channel.parent?.type === ChannelType.GuildForum;

    if (!isForum) {
      return interaction.reply({
        content: "This command must be used in a forum channel.",
        ephemeral: true
      });
    }

    const forumChannel =
      interaction.channel.type === ChannelType.GuildForum
        ? interaction.channel
        : interaction.channel.parent;

    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    await forumChannel.threads.create({
      name: title,
      message: {
        content: message || null,
        files: image ? [image] : []
      }
    });

    return interaction.reply({
      content: "Forum post created.",
      ephemeral: true
    });
  }
});

/* ---------------- LOGIN ---------------- */

client.login(DISCORD_TOKEN);
