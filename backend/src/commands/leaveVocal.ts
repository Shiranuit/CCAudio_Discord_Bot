import { SlashCommandBuilder } from '@discordjs/builders';
import { getVoiceConnection } from '@discordjs/voice';
import { CacheType, CommandInteraction, Client, GuildVoiceChannelResolvable, BaseGuild, BaseGuildVoiceChannel } from 'discord.js';
import { Command } from '../core/commands/command';

export class LeaveVocalCommand extends Command {
  constructor () {
    super('leavevocal');
  }

  protected buildCommand(commandBuilder: SlashCommandBuilder): void {
    commandBuilder
      .setDescription('Forces the bot to join the voice channel');
  }
  public async execute(interaction: CommandInteraction<CacheType>, client: Client): Promise<void> {
    if (! interaction.guild) {
      await interaction.reply({content: 'You can only make the bot join users in a guild', ephemeral: true});
      return;
    }

    const connection = getVoiceConnection(interaction.guildId!);

    if (! connection) {
      await interaction.reply({content: 'Bot is not in a voice channel', ephemeral: true});
      return;
    }

    connection.disconnect();
    await interaction.reply({content: 'Left voice channel', ephemeral: true});
  }
}
