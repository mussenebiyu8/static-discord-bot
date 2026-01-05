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
const STATIC_ROLE_ID = process.env.STATIC_ROLE_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN missing");
if (!STATIC_ROLE_ID) throw new Error("STATIC_ROLE_ID missing");
if (!GUILD_ID) throw new Error("GUILD_ID missing");

/* ---------------- COMMAND DEFINITIONS ---------------- */

const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message")
    .addStringOption(o =>
      o.setName("message").setDescription("Message text").setRequired(false)
    )
    .addAttachmentOption(o => o.setName("image1").setDescription("Image 1"))
    .addAttachmentOption(o => o.setName("image2").setDescription("Image 2"))
    .addAttachmentOption(o => o.setName("image3").setDescription("Image 3"))
    .addAttachmentOption(o => o.setName("image4").setDescription("Image 4")),

  new SlashCommandBuilder()
    .setName("updatestatic")
    .setDescription("Update a static message")
    .addStringOption(o =>
      o.setName("message_id")
        .setDescription("Message ID")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message").setDescription("New message text")
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("New image")
    ),

  new SlashCommandBuilder()
    .setName("setstaticforum")
    .setDescription("Create a static forum post")
    .addStringOption(o =>
      o.setName("title")
        .setDescription("Forum post title")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message").setDescription("Post content")
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("Optional image")
    )
];

/* ---------------- REGISTER GUILD COMMANDS ---------------- */

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationGuildCommands(client.user.id, GUILD_ID),
    { body: commands.map(c => c.toJSON()) }
  );

  console.log("Guild slash commands registered.");
});

/* ---------------- INTERACTION HANDLER ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  /* ---------- ROLE CHECK ---------- */
  if (!interaction.member.roles.cache.has(STATIC_ROLE_ID)) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true
    });
  }

  /* ---------- /setstatic ---------- */
  if (interaction.commandName === "setstatic") {
    const text = interaction.options.getString("message");

    const images = ["image1", "image2", "image3", "image4"]
      .map(name => interaction.options.getAttachment(name))
      .filter(Boolean);

    await interaction.channel.send({
      content: text || undefined,
      files: images.length ? images : undefined
    });

    return interaction.reply({
      content: "Static message sent.",
      ephemeral: true
    });
  }

  /* ---------- /updatestatic ---------- */
  if (interaction.commandName === "updatestatic") {
    const messageId = interaction.options.getString("message_id");
    const newText = interaction.options.getString("message");
    const image = interaction.options.getAttachment("image");

    const msg = await interaction.channel.messages.fetch(messageId);

    await msg.edit({
      content: newText ?? msg.content,
      files: image ? [image] : undefined
    });

    return interaction.reply({
      content: "Message updated.",
      ephemeral: true
    });
  }

  /* ---------- /setstaticforum ---------- */
  if (interaction.commandName === "setstaticforum") {
    const forum =
      interaction.channel.type === ChannelType.GuildForum
        ? interaction.channel
        : interaction.channel.parent;

    if (!forum || forum.type !== ChannelType.GuildForum) {
      return interaction.reply({
        content: "Use this command inside a forum channel.",
        ephemeral: true
      });
    }

    const title = interaction.options.getString("title");
    const text = interaction.options.getString("message");
    const image = interaction.options.getAttachment("image");

    await forum.threads.create({
      name: title,
      message: {
        content: text || undefined,
        files: image ? [image] : undefined
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
