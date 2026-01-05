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

/* ---------------- ENV ---------------- */

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const STATIC_ROLE_ID = process.env.STATIC_ROLE_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN || !STATIC_ROLE_ID || !GUILD_ID) {
  throw new Error("Missing required environment variables");
}

/* ---------------- COMMANDS ---------------- */

const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message")
    .addStringOption(o =>
      o.setName("message").setDescription("Message").setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("Optional image").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("updatestatic")
    .setDescription("Update a static message")
    .addStringOption(o =>
      o.setName("message_id").setDescription("Message ID").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message").setDescription("New text").setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("New image").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("setstaticforum")
    .setDescription("Create a forum post")
    .addStringOption(o =>
      o.setName("title").setDescription("Post title").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("message").setDescription("Post content").setRequired(false)
    )
    .addAttachmentOption(o =>
      o.setName("image").setDescription("Optional image").setRequired(false)
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

/* ---------------- INTERACTIONS ---------------- */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guild) return;

  // ✅ SAFE ROLE CHECK
  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (!member.roles.cache.has(STATIC_ROLE_ID)) {
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

    return interaction.reply({ content: "Message sent.", ephemeral: true });
  }

  /* ---------- /updatestatic ---------- */
  if (interaction.commandName === "updatestatic") {
    const id = interaction.options.getString("message_id");
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    const msg = await interaction.channel.messages.fetch(id);
    await msg.edit({
      content: message || msg.content,
      files: image ? [image] : []
    });

    return interaction.reply({ content: "Message updated.", ephemeral: true });
  }

  /* ---------- /setstaticforum ---------- */
  if (interaction.commandName === "setstaticforum") {
    const isForum =
      interaction.channel.type === ChannelType.GuildForum ||
      interaction.channel.parent?.type === ChannelType.GuildForum;

    if (!isForum) {
      return interaction.reply({
        content: "Use this command inside a forum channel.",
        ephemeral: true
      });
    }

    const forum =
      interaction.channel.type === ChannelType.GuildForum
        ? interaction.channel
        : interaction.channel.parent;

    const title = interaction.options.getString("title");
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    await forum.threads.create({
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
