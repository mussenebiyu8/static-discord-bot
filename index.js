import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;
const STATIC_ROLE_ID = process.env.STATIC_ROLE_ID;

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message (text + optional image)")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Message text")
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName("image")
        .setDescription("Image to send")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("updatestatic")
    .setDescription("Update a static message (text + optional image)")
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
    )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(c => c.toJSON()) }
  );
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Role check
  if (!interaction.member.roles.cache.has(STATIC_ROLE_ID)) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "setstatic") {
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    await interaction.channel.send({
      content: message || null,
      files: image ? [image] : []
    });

    await interaction.reply({
      content: "Message sent.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "updatestatic") {
    const id = interaction.options.getString("message_id");
    const newMessage = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    const msg = await interaction.channel.messages.fetch(id);

    await msg.edit({
      content: newMessage || msg.content || null,
      files: image ? [image] : []
    });

    await interaction.reply({
      content: "Message updated.",
      ephemeral: true
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
