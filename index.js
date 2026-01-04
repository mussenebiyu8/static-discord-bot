import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST
} from "discord.js";

// Create client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ✅ ENVIRONMENT VARIABLES (Railway)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const STATIC_ROLE_ID = process.env.STATIC_ROLE_ID;

// ❗ Safety check (helps debugging)
if (!DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is missing!");
  process.exit(1);
}

if (!STATIC_ROLE_ID) {
  console.error("STATIC_ROLE_ID is missing!");
  process.exit(1);
}

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Message to send")
        .setRequired(true)
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
        .setDescription("New message")
        .setRequired(true)
    )
];

// REST for registering slash commands
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

// When bot is ready
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log("✅ Slash commands registered");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
});

// Handle commands
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // Role check
  if (!interaction.member.roles.cache.has(STATIC_ROLE_ID)) {
    return interaction.reply({
      content: "❌ You do not have permission to use this command.",
      ephemeral: true
    });
  }

  // /setstatic
  if (interaction.commandName === "setstatic") {
    const message = interaction.options.getString("message");

    await interaction.channel.send(message);
    await interaction.reply({
      content: "✅ Static message sent.",
      ephemeral: true
    });
  }

  // /updatestatic
  if (interaction.commandName === "updatestatic") {
    const messageId = interaction.options.getString("message_id");
    const newMessage = interaction.options.getString("message");

    try {
      const msg = await interaction.channel.messages.fetch(messageId);
      await msg.edit(newMessage);

      await interaction.reply({
        content: "✅ Static message updated.",
        ephemeral: true
      });
    } catch {
      await interaction.reply({
        content: "❌ Could not find or edit that message.",
        ephemeral: true
      });
    }
  }
});

// ✅ LOGIN (THIS MUST MATCH THE VARIABLE ABOVE)
client.login(DISCORD_TOKEN);
