import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  ChannelType
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Environment variables (Railway)
const TOKEN = process.env.DISCORD_TOKEN;
const STATIC_ROLE_ID = process.env.STATIC_ROLE_ID;

/* ---------------- SLASH COMMAND DEFINITIONS ---------------- */

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
        .setDescription("ID of the message to edit")
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

/* ---------------- REGISTER COMMANDS ---------------- */

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(cmd => cmd.toJSON()) }
  );
});

/* ---------------- COMMAND HANDLER ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Role restriction
  if (!interaction.member.roles.cache.has(STATIC_ROLE_ID)) {
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
    // ✅ CORRECT forum channel check
    if (interaction.channel.type !== ChannelType.GuildForum) {
      return interaction.reply({
        content: "This command must be used inside a forum channel.",
        ephemeral: true
      });
    }

    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    await interaction.channel.threads.create({
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

client.login(process.env.DISCORD_TOKEN);
