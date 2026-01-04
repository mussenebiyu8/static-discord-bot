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

const commands = [
  new SlashCommandBuilder()
    .setName("setstatic")
    .setDescription("Send a static message")
    .addStringOption(o =>
      o.setName("message").setDescription("Message text").setRequired(false)
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
    .setDescription("Create a static forum post")
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

    return interaction.reply({ content: "Message sent.", ephemeral: true });
  }

  if (interaction.commandName === "updatestatic") {
    const id = interaction.options.getString("message_id");
    const message = interaction.options.getString("message") ?? "";
    const image = interaction.options.getAttachment("image");

    const msg = await interaction.channel.messages.fetch(id);
    await msg.edit({
      content: message || msg.content || null,
      files: image ? [image] : []
    });

    return interaction.reply({ content: "Message updated.", ephemeral: true });
  }

  if (interaction.commandName === "setstaticforum") {
    if (!interaction.channel.isThreadOnly()) {
      return interaction.reply({
        content: "Use this command inside a forum channel.",
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

client.login(process.env.DISCORD_TOKEN);
