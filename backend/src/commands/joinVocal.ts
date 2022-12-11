import { SlashCommandBuilder } from '@discordjs/builders';
import { EndBehaviorType, joinVoiceChannel } from '@discordjs/voice';
import { CacheType, CommandInteraction, Client, GuildVoiceChannelResolvable, BaseGuild, BaseGuildVoiceChannel } from 'discord.js';
import { Command } from '../core/commands/command';
import { AudioTransmitter } from '../services/audioTransmitter';
import fs from 'fs';
import prism from 'prism-media';

export class JoinVocalCommand extends Command {
  private audioTransmitter: AudioTransmitter;
  constructor (audioTransmitter: AudioTransmitter) {
    super('joinvocal');
    this.audioTransmitter = audioTransmitter;
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

    const member = await interaction.guild?.members.fetch(interaction.user);

    if (! member) {
      await interaction.reply({content: 'Could not find user', ephemeral: true});
      return;
    }

    if (! member.voice.channel) {
      await interaction.reply({content: 'User is not in a voice channel', ephemeral: true});
      return;
    }

    await interaction.reply({content: `Joining voice channel of ${member.user.tag}`, ephemeral: true});

    const connection = joinVoiceChannel({
      channelId: member.voice.channel.id,
      guildId: member.voice.channel.guildId,
      adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
    });

    connection.receiver.speaking.on('start', (userId) => {
      const stream = connection.receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 100,
        },
      });

      const pcmStream = stream.pipe(new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }));
      pcmStream.on('data', (data: Buffer) => {
        const guildId = interaction.guildId!;
        this.audioTransmitter.sendAudio(guildId, userId, data);
      });
    });
  }
}
