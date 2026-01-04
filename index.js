import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST
} from "discord.js";

/* ===== ENV CHECK ===== */
if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN is missing!");
  process.exit(1);
}

if (!process.env.STATIC_ROLE_ID) {
  console.error("STATIC_ROLE_ID is missing!");
  process.exit(1);
}

/* ===== CLIENT ===== */
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ===== COMMANDS ===== */
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

/* ===== REGISTER COMMANDS ===== */
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(cmd => cmd.toJSON()) }
  );

  console.log("Slash commands registered.");
});

/* ===== INTERACTIONS ===== */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const roleId = process.env.STATIC_ROLE_ID;

  if (!interaction.member.roles.cache.has(roleId)) {
    return interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true
    });
  }

  if (interaction.commandName === "setstatic") {
    const message = interaction.options.getString("message");
    await interaction.channel.send(message);
    await interaction.reply({ content: "Message sent.", ephemeral: true });
  }

  if (interaction.commandName === "updatestatic") {
    const messageId = interaction.options.getString("message_id");
    const newMessage = interaction.options.getString("message");

    const msg = await interaction.channel.messages.fetch(messageId);
    await msg.edit(newMessage);

    await interaction.reply({ content: "Message updated.", ephemeral: true });
  }
});

/* ===== LOGIN ===== */
client.login(process.env.DISCORD_TOKEN);
