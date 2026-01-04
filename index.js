import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  PermissionFlagsBits
} from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const STATIC_ROLE_ID = process.env.STATIC_ROLE_ID;

const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message")
    .addStringOption(option =>
      option.setName("message")
        .setDescription("Message to send")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("updatestatic")
    .setDescription("Update a static message")
    .addStringOption(option =>
      option.setName("message_id")
        .setDescription("Message ID to update")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("message")
        .setDescription("New message")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands.map(c => c.toJSON()) }
  );
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.roles.cache.has(STATIC_ROLE_ID)) {
    return interaction.reply({ content: "You don’t have permission.", ephemeral: true });
  }

  if (interaction.commandName === "setstatic") {
    const msg = interaction.options.getString("message");
    await interaction.channel.send(msg);
    await interaction.reply({ content: "Message sent.", ephemeral: true });
  }

  if (interaction.commandName === "updatestatic") {
    const id = interaction.options.getString("message_id");
    const msg = interaction.options.getString("message");
    const message = await interaction.channel.messages.fetch(id);
    await message.edit(msg);
    await interaction.reply({ content: "Message updated.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
