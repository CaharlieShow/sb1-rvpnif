import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits
} from 'discord.js';
import { db } from '../database.js';

export function setupBot(client) {
  client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
  });

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
      if (interaction.customId === 'create_ticket') {
        await handleTicketCreation(interaction);
      }
    }
  });
}

async function handleTicketCreation(interaction) {
  const guild = interaction.guild;
  
  // Get server settings
  db.get('SELECT * FROM server_settings WHERE guild_id = ?', [guild.id], async (err, settings) => {
    if (err) {
      console.error(err);
      return interaction.reply({ content: 'Error creating ticket', ephemeral: true });
    }

    const categoryId = settings?.ticket_category;
    const category = categoryId ? await guild.channels.cache.get(categoryId) : null;

    // Create ticket channel
    const channel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: category,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        },
      ],
    });

    // Save ticket to database
    db.run(
      'INSERT INTO tickets (guild_id, channel_id, user_id, status) VALUES (?, ?, ?, ?)',
      [guild.id, channel.id, interaction.user.id, 'open']
    );

    // Send welcome message
    const embed = new EmbedBuilder()
      .setTitle('Ticket Created')
      .setDescription('Support will be with you shortly. Please describe your issue.')
      .setColor('#00ff00');

    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeButton);

    await channel.send({
      content: `Welcome ${interaction.user}!`,
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: `Ticket created! Check ${channel}`,
      ephemeral: true,
    });
  });
}